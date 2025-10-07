import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertRoomSchema, insertPlayerSchema, insertDescriptionSchema, insertVoteSchema, type GameState, type Player } from "@shared/schema";
import { randomUUID } from "crypto";

interface WebSocketMessage {
  type: string;
  data?: any;
  roomId?: string;
  playerId?: string;
}

interface ClientConnection extends WebSocket {
  playerId?: string;
  roomId?: string;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Store WebSocket connections
  const connections = new Map<string, ClientConnection>();

  // Broadcast to all clients in a room
  function broadcastToRoom(roomId: string, message: WebSocketMessage, excludePlayerId?: string) {
    connections.forEach((client, clientId) => {
      if (client.roomId === roomId && 
          client.playerId !== excludePlayerId && 
          client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  // Generate room code
  function generateRoomCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  wss.on('connection', (ws: ClientConnection) => {
    const connectionId = randomUUID();
    connections.set(connectionId, ws);

    ws.on('message', async (data) => {
      try {
        const message: WebSocketMessage = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'create_room': {
            const { playerName, settings } = message.data;
            const roomCode = generateRoomCode();
            
            // Create host player first to get the actual player ID
            const tempRoomId = randomUUID();
            
            // Create room (we'll update hostId after creating the player)
            const room = await storage.createRoom({
              code: roomCode,
              hostId: tempRoomId, // Temporary, will update
              settings,
            });
            
            // Create host player
            const player = await storage.createPlayer({
              roomId: room.id,
              name: playerName,
            });
            
            // Update room with actual host ID
            await storage.updateRoom(room.id, { hostId: player.id });
            await storage.updatePlayer(player.id, { isHost: true });
            
            // Set connection info using the actual player ID from storage
            ws.playerId = player.id;
            ws.roomId = room.id;
            
            ws.send(JSON.stringify({
              type: 'room_created',
              data: { roomCode, playerId: player.id, roomId: room.id },
            }));
            
            break;
          }
          
          case 'join_room': {
            const { roomCode, playerName } = message.data;
            const room = await storage.getRoomByCode(roomCode);
            
            if (!room) {
              ws.send(JSON.stringify({
                type: 'error',
                data: { message: 'Room not found' },
              }));
              return;
            }
            
            if (room.phase !== 'lobby') {
              ws.send(JSON.stringify({
                type: 'error',
                data: { message: 'Game already in progress' },
              }));
              return;
            }
            
            // Create player and use the actual player ID from storage
            const player = await storage.createPlayer({
              roomId: room.id,
              name: playerName,
            });
            
            // Set connection info using the actual player ID from storage
            ws.playerId = player.id;
            ws.roomId = room.id;
            
            ws.send(JSON.stringify({
              type: 'room_joined',
              data: { playerId: player.id, roomId: room.id },
            }));
            
            // Broadcast to other players
            broadcastToRoom(room.id, {
              type: 'player_joined',
              data: player,
            }, player.id);
            
            // Send current game state
            const gameState = await storage.getGameState(room.id);
            ws.send(JSON.stringify({
              type: 'game_state',
              data: gameState,
            }));
            
            break;
          }
          
          case 'start_game': {
            const { roomId } = message.data;
            const room = await storage.getRoomById(roomId);
            const players = await storage.getPlayersByRoomId(roomId);
            
            if (!room || players.length < 3) {
              ws.send(JSON.stringify({
                type: 'error',
                data: { message: 'Need at least 3 players to start' },
              }));
              return;
            }
            
            // Assign roles and words
            await storage.assignRoles(roomId);
            
            // Set game phase to descriptive
            await storage.updateRoom(roomId, { phase: 'descriptive' });
            
            // Assign turn order and get first player
            const firstPlayerId = await storage.assignTurnOrder(roomId);
            
            const gameState = await storage.getGameState(roomId);
            if (gameState) {
              gameState.currentTurn = firstPlayerId;
            }
            
            broadcastToRoom(roomId, {
              type: 'game_started',
              data: gameState,
            });
            
            break;
          }
          
          case 'submit_description': {
            const { roomId, playerId, description } = message.data;
            const room = await storage.getRoomById(roomId);
            
            if (!room || room.phase !== 'descriptive') return;
            
            await storage.createDescription({
              roomId,
              playerId,
              description,
              round: room.currentRound,
            });
            
            await storage.updatePlayer(playerId, { hasSubmittedDescription: true });
            
            // Check if all alive players have submitted
            const players = await storage.getPlayersByRoomId(roomId);
            const alivePlayers = players.filter(p => p.isAlive);
            const submittedCount = alivePlayers.filter(p => p.hasSubmittedDescription).length;
            
            if (submittedCount === alivePlayers.length) {
              // Move to voting phase
              await storage.updateRoom(roomId, { phase: 'voting' });
              
              // Reset submission status
              for (const player of alivePlayers) {
                await storage.updatePlayer(player.id, { hasSubmittedDescription: false });
              }
            } else {
              // Next player's turn
              const currentPlayerIndex = alivePlayers.findIndex(p => p.id === playerId);
              const nextPlayerIndex = (currentPlayerIndex + 1) % alivePlayers.length;
              const nextPlayerId = alivePlayers[nextPlayerIndex].id;
              
              const gameState = await storage.getGameState(roomId);
              if (gameState) {
                gameState.currentTurn = nextPlayerId;
              }
            }
            
            const gameState = await storage.getGameState(roomId);
            broadcastToRoom(roomId, {
              type: 'description_submitted',
              data: gameState,
            });
            
            break;
          }
          
          case 'cast_vote': {
            const { roomId, voterId, targetId } = message.data;
            const room = await storage.getRoomById(roomId);
            
            if (!room || room.phase !== 'voting') return;
            
            // Remove existing vote from this player
            const existingVotes = await storage.getVotesByRoom(roomId, room.currentRound);
            const existingVote = existingVotes.find(v => v.voterId === voterId);
            if (existingVote) {
              await storage.clearVotes(roomId, room.currentRound);
              // Re-add all votes except the one being changed
              for (const vote of existingVotes) {
                if (vote.voterId !== voterId) {
                  await storage.createVote({
                    roomId: vote.roomId,
                    voterId: vote.voterId,
                    targetId: vote.targetId,
                    round: vote.round,
                  });
                }
              }
            }
            
            // Add new vote
            await storage.createVote({
              roomId,
              voterId,
              targetId,
              round: room.currentRound,
            });
            
            await storage.updatePlayer(voterId, { hasVoted: true });
            
            // Check if all alive players have voted
            const players = await storage.getPlayersByRoomId(roomId);
            const alivePlayers = players.filter(p => p.isAlive);
            const votedCount = alivePlayers.filter(p => p.hasVoted).length;
            
            if (votedCount === alivePlayers.length) {
              // Calculate elimination
              const votes = await storage.getVotesByRoom(roomId, room.currentRound);
              const voteCount: { [playerId: string]: number } = {};
              
              votes.forEach(vote => {
                voteCount[vote.targetId] = (voteCount[vote.targetId] || 0) + 1;
              });
              
              // Find player with most votes
              let eliminatedPlayerId = '';
              let maxVotes = 0;
              Object.entries(voteCount).forEach(([playerId, count]) => {
                if (count > maxVotes) {
                  maxVotes = count;
                  eliminatedPlayerId = playerId;
                }
              });
              
              if (eliminatedPlayerId) {
                const eliminatedPlayer = await storage.updatePlayer(eliminatedPlayerId, { isAlive: false });
                
                // Reset voting status
                for (const player of alivePlayers) {
                  await storage.updatePlayer(player.id, { hasVoted: false });
                }
                
                // Check if eliminated player is Mr. White
                if (eliminatedPlayer?.role === 'mrWhite') {
                  await storage.updateRoom(roomId, { phase: 'mrWhiteGuess' });
                  
                  const gameState = await storage.getGameState(roomId);
                  if (gameState) {
                    gameState.eliminatedPlayer = eliminatedPlayer;
                  }
                  
                  broadcastToRoom(roomId, {
                    type: 'mr_white_eliminated',
                    data: gameState,
                  });
                } else {
                  // Check win condition
                  const winCondition = await storage.checkWinCondition(roomId);
                  
                  if (winCondition) {
                    await storage.updateRoom(roomId, { phase: 'gameOver' });
                    await storage.updateScores(roomId, winCondition.team);
                    
                    const gameState = await storage.getGameState(roomId);
                    if (gameState) {
                      gameState.winner = winCondition;
                    }
                    
                    broadcastToRoom(roomId, {
                      type: 'game_over',
                      data: gameState,
                    });
                  } else {
                    // Continue to next descriptive round
                    await storage.updateRoom(roomId, { 
                      phase: 'descriptive',
                      currentRound: room.currentRound + 1,
                    });
                    
                    const nextPlayerId = await storage.assignTurnOrder(roomId);
                    const gameState = await storage.getGameState(roomId);
                    if (gameState) {
                      gameState.currentTurn = nextPlayerId;
                    }
                    
                    broadcastToRoom(roomId, {
                      type: 'next_round',
                      data: gameState,
                    });
                  }
                }
              }
            } else {
              const gameState = await storage.getGameState(roomId);
              broadcastToRoom(roomId, {
                type: 'vote_cast',
                data: gameState,
              });
            }
            
            break;
          }
          
          case 'mr_white_guess': {
            const { roomId, playerId, guess } = message.data;
            const room = await storage.getRoomById(roomId);
            
            if (!room || room.phase !== 'mrWhiteGuess') return;
            
            const players = await storage.getPlayersByRoomId(roomId);
            const civilianWord = players.find(p => p.role === 'civilian')?.word;
            
            if (guess.toLowerCase() === civilianWord?.toLowerCase()) {
              // Mr. White wins
              await storage.updateRoom(roomId, { phase: 'gameOver' });
              await storage.updateScores(roomId, 'mrWhite');
              
              const gameState = await storage.getGameState(roomId);
              if (gameState) {
                gameState.winner = {
                  team: 'mrWhite',
                  players: players.filter(p => p.role === 'mrWhite'),
                };
              }
              
              broadcastToRoom(roomId, {
                type: 'mr_white_wins',
                data: gameState,
              });
            } else {
              // Check regular win condition
              const winCondition = await storage.checkWinCondition(roomId);
              
              if (winCondition) {
                await storage.updateRoom(roomId, { phase: 'gameOver' });
                await storage.updateScores(roomId, winCondition.team);
                
                const gameState = await storage.getGameState(roomId);
                if (gameState) {
                  gameState.winner = winCondition;
                }
                
                broadcastToRoom(roomId, {
                  type: 'game_over',
                  data: gameState,
                });
              }
            }
            
            break;
          }
          
          case 'exit_room': {
            const { playerId, roomId } = message.data;
            
            await storage.removePlayer(playerId);
            
            // Check if host left and reassign
            const room = await storage.getRoomById(roomId);
            if (room?.hostId === playerId) {
              const remainingPlayers = await storage.getPlayersByRoomId(roomId);
              if (remainingPlayers.length > 0) {
                const newHost = remainingPlayers[0];
                await storage.updateRoom(roomId, { hostId: newHost.id });
                await storage.updatePlayer(newHost.id, { isHost: true });
              }
            }
            
            broadcastToRoom(roomId, {
              type: 'player_left',
              data: { playerId },
            }, playerId);
            
            ws.close();
            break;
          }
          
          case 'reconnect': {
            const { playerId } = message.data;
            const player = await storage.getPlayerById(playerId);
            
            if (player) {
              ws.playerId = playerId;
              ws.roomId = player.roomId;
              
              const gameState = await storage.getGameState(player.roomId);
              ws.send(JSON.stringify({
                type: 'reconnected',
                data: { gameState, playerId },
              }));
            }
            
            break;
          }
        }
      } catch (error) {
        console.error('WebSocket error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          data: { message: 'Invalid message format' },
        }));
      }
    });

    ws.on('close', () => {
      connections.delete(connectionId);
    });

    ws.on('error', (error) => {
      console.error('WebSocket connection error:', error);
      connections.delete(connectionId);
    });
  });

  return httpServer;
}
