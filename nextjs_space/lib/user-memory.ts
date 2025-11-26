
/**
 * 🧠 User Memory System
 * Onthoud gebruikersinformatie zoals naam, locatie, voorkeuren
 */

export interface UserMemory {
  name?: string;
  location?: string;
  city?: string;
  country?: string;
  preferences?: Record<string, any>;
  conversationContext?: string[];
  lastUpdated: Date;
}

export class MemoryManager {
  private memory: Map<string, UserMemory> = new Map();
  
  // Get user memory
  getUserMemory(clientId: string): UserMemory {
    if (!this.memory.has(clientId)) {
      this.memory.set(clientId, {
        lastUpdated: new Date(),
      });
    }
    return this.memory.get(clientId)!;
  }
  
  // Update user info
  updateUserInfo(clientId: string, updates: Partial<UserMemory>) {
    const current = this.getUserMemory(clientId);
    this.memory.set(clientId, {
      ...current,
      ...updates,
      lastUpdated: new Date(),
    });
  }
  
  // Add to conversation context
  addContext(clientId: string, context: string) {
    const current = this.getUserMemory(clientId);
    const contextList = current.conversationContext || [];
    contextList.push(context);
    
    // Keep only last 10 contexts
    if (contextList.length > 10) {
      contextList.shift();
    }
    
    this.updateUserInfo(clientId, {
      conversationContext: contextList,
    });
  }
  
  // Generate memory summary for AI
  getMemorySummary(clientId: string): string {
    const memory = this.getUserMemory(clientId);
    const parts: string[] = [];
    
    if (memory.name) {
      parts.push(`De gebruiker heet ${memory.name}.`);
    }
    
    if (memory.location) {
      parts.push(`De gebruiker woont in ${memory.location}.`);
    }
    
    if (memory.city) {
      parts.push(`Stad: ${memory.city}.`);
    }
    
    if (memory.preferences && Object.keys(memory.preferences).length > 0) {
      parts.push(`Voorkeuren: ${JSON.stringify(memory.preferences)}`);
    }
    
    if (memory.conversationContext && memory.conversationContext.length > 0) {
      parts.push(`Recente context: ${memory.conversationContext.slice(-3).join(', ')}`);
    }
    
    return parts.length > 0 ? parts.join(' ') : 'Geen gebruikersinformatie opgeslagen.';
  }
}

// Global instance
export const memoryManager = new MemoryManager();
