# AI Agent Terminal - Complete Flow Diagram

## 🔄 Request Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERACTION                             │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ User types:
                                  │ "Genereer 5 blogs voor Bakkerij Jansen"
                                  │
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    AGENT TERMINAL UI                                 │
│                (components/agent/agent-terminal.tsx)                │
│                                                                       │
│  • Validates input                                                   │
│  • Shows user message bubble                                        │
│  • Calls API with streaming enabled                                 │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ POST /api/agent/chat
                                  │ { messages: [...], stream: true }
                                  │
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      API ROUTE                                       │
│                 (app/api/agent/chat/route.ts)                       │
│                                                                       │
│  • Checks authentication (admin only)                               │
│  • Validates request body                                           │
│  • Calls AI Brain with messages                                     │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ processAgentChat(messages)
                                  │
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    AI BRAIN ORCHESTRATOR                             │
│                   (lib/ai-brain/index.ts)                           │
│                                                                       │
│  Using: Claude Opus 4.5                                             │
│                                                                       │
│  1. Adds system prompt                                              │
│  2. Calls AIML API with function calling                            │
│  3. Analyzes user request                                           │
│                                                                       │
│  Decision: "Need to find client first, then generate content"      │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ Returns tool_calls
                                  │
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      TOOL CALLS                                      │
│                                                                       │
│  [                                                                   │
│    {                                                                 │
│      id: "call_abc123",                                             │
│      name: "get_clients",                                           │
│      parameters: { search: "Bakkerij Jansen" },                    │
│      status: "pending"                                              │
│    }                                                                 │
│  ]                                                                   │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ Streamed back to UI
                                  │
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    TERMINAL UI (Update)                              │
│                                                                       │
│  Shows:                                                              │
│  ⚡ Executing: get_clients("Bakkerij Jansen")                       │
│                                                                       │
│  UI sends back: Execute these tools                                 │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ POST /api/agent/chat
                                  │ { messages: [...], toolCalls: [...] }
                                  │
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    TOOL EXECUTOR                                     │
│                 (lib/ai-brain/tool-executor.ts)                     │
│                                                                       │
│  executeTool("get_clients", { search: "Bakkerij Jansen" })         │
│                                                                       │
│  1. Queries database with Prisma                                    │
│  2. Finds client with matching name                                 │
│  3. Returns client details                                          │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ Result:
                                  │ { success: true, data: { id: "xyz", name: "..." } }
                                  │
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    TERMINAL UI (Update)                              │
│                                                                       │
│  Shows:                                                              │
│  ✅ Client gevonden: Bakkerij Jansen (ID: xyz)                      │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ Tool results sent back to AI Brain
                                  │
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    AI BRAIN (Continue)                               │
│                                                                       │
│  Claude analyzes tool results:                                      │
│  "Client found! Now need to generate 5 blogs"                      │
│                                                                       │
│  Determines best model:                                             │
│  Task: blog_long → Uses Model Router                                │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ selectBestModel({ task: 'blog_long' })
                                  │
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    MODEL ROUTER                                      │
│                (lib/ai-brain/model-router.ts)                       │
│                                                                       │
│  Task: blog_long                                                    │
│  Priority: quality                                                  │
│  Language: nl                                                       │
│                                                                       │
│  Routing Logic:                                                     │
│  blog_long → Primary: Claude Sonnet 4.5                            │
│           → Fallback: GPT-5.1                                       │
│           → Budget: DeepSeek V3                                     │
│                                                                       │
│  Selected: Claude Sonnet 4.5                                        │
│  (Beste voor lange Nederlandse blogs)                              │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ Returns: Claude Sonnet 4.5 model
                                  │
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    AI BRAIN (Next Tool Calls)                        │
│                                                                       │
│  Returns 5x generate_article tool calls:                           │
│                                                                       │
│  [                                                                   │
│    { name: "generate_article",                                      │
│      parameters: {                                                  │
│        clientId: "xyz",                                             │
│        topic: "De Kunst van Zuurdesem",                            │
│        wordCount: 2000                                              │
│      }                                                               │
│    },                                                                │
│    ... (4 more)                                                     │
│  ]                                                                   │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ Streamed to UI
                                  │
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    TERMINAL UI (Progress)                            │
│                                                                       │
│  Shows real-time:                                                    │
│  ⚡ Executing: generate_article()                                    │
│  ⏳ Blog 1/5 genereren met Claude Sonnet 4.5...                     │
│  ✅ "De Kunst van Zuurdesem" - 2,134 woorden                        │
│                                                                       │
│  ⏳ Blog 2/5 genereren...                                            │
│  ✅ "Volkoren vs Witbrood" - 1,987 woorden                          │
│                                                                       │
│  ... (continues for all 5 blogs)                                   │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ All tools complete
                                  │
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    AI BRAIN (Final Response)                         │
│                                                                       │
│  Claude generates summary:                                          │
│                                                                       │
│  "Ik heb succesvol 5 blogs gegenereerd voor Bakkerij Jansen       │
│   over verschillende broodsoorten. Alle artikelen zijn 2000+       │
│   woorden en geoptimaliseerd voor SEO. De blogs behandelen:        │
│                                                                       │
│   1. De Kunst van Zuurdesem (2,134 woorden)                        │
│   2. Volkoren vs Witbrood (1,987 woorden)                          │
│   3. Geschiedenis van Brood (2,156 woorden)                        │
│   4. Gezonde Broodkeuzes (2,045 woorden)                           │
│   5. Ambachtelijk Bakken (2,201 woorden)                           │
│                                                                       │
│   Wil je dat ik deze direct naar WordPress publiceer?"             │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ Streamed to UI
                                  │
                                  ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    TERMINAL UI (Complete)                            │
│                                                                       │
│  Agent message bubble shows full response with formatting          │
│  User can continue conversation or give new command                 │
└─────────────────────────────────────────────────────────────────────┘
```

## 🎯 Component Interaction Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                      COMPONENT TREE                               │
└──────────────────────────────────────────────────────────────────┘

AgentTerminal (Main Container)
│
├─── Header
│    └─── Terminal Icon + Title
│
├─── Messages Area (Scrollable)
│    │
│    ├─── AgentMessage (User)
│    │    ├─── User Avatar
│    │    └─── Message Content (Plain Text)
│    │
│    ├─── AgentMessage (Assistant)
│    │    ├─── Bot Avatar
│    │    └─── Message Content (Markdown)
│    │
│    ├─── ToolExecution (Multiple)
│    │    ├─── Status Icon (Spinner/Check/X)
│    │    ├─── Tool Name + Status Badge
│    │    ├─── Result Message
│    │    └─── Collapsible Details
│    │         ├─── Parameters JSON
│    │         └─── Result Data JSON
│    │
│    └─── Loading Indicator
│
└─── Input Area (Bottom)
     ├─── Textarea (Auto-resize)
     ├─── Send Button
     └─── Keyboard Hint
```

## 🔄 State Management Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    REACT STATE FLOW                              │
└─────────────────────────────────────────────────────────────────┘

[useState] messages: Message[]
  ↓
  ├─── Add user message on submit
  ├─── Add assistant message when streaming
  └─── Update last message during stream

[useState] input: string
  ↓
  ├─── Update on textarea change
  └─── Clear on submit

[useState] isLoading: boolean
  ↓
  ├─── true: Show loading, disable input
  └─── false: Enable input

[useState] currentToolCalls: ToolCall[]
  ↓
  ├─── Set when tools are called
  ├─── Update status during execution
  └─── Clear when complete

[useEffect] Auto-scroll
  ↓
  └─── Scroll to bottom when messages/tools update

[useRef] messagesEndRef
  ↓
  └─── Target for auto-scroll

[useRef] textareaRef
  ↓
  └─── Focus management
```

## 🎨 Data Flow Example

```
User Input: "Toon me de beste modellen voor code"
     ↓
API Call: POST /api/agent/chat
     ↓
AI Brain: Analyzes request
     │
     ├─ Detects task: "code_generate"
     ├─ Calls Model Router
     └─ Gets recommendations
     ↓
Model Router:
     │
     ├─ Primary: Claude Sonnet 4.5
     │   • Quality: 5/5
     │   • Context: 1M tokens
     │   • Best for code
     │
     ├─ Fallback: GPT-5.1
     │   • Quality: 5/5
     │   • Reasoning mode
     │
     └─ Budget: Qwen Coder
         • Quality: 4/5
         • Very affordable
     ↓
AI Brain: Formats response
     ↓
Stream: Sends chunks to UI
     ↓
UI Updates: Real-time rendering
     ↓
User sees: Formatted model comparison
```

## 🚀 Performance Flow

```
┌────────────────────────────────────────────────────────────┐
│              STREAMING PERFORMANCE                          │
└────────────────────────────────────────────────────────────┘

Request Start (t=0ms)
     ↓
Auth Check (t=5ms)
     ↓
AI Brain Init (t=10ms)
     ↓
AIML API Call (t=15ms)
     ↓
First Token Received (t=200ms) ← User sees response starting
     ↓
Stream Tokens (t=200-2000ms) ← Smooth updates
     ↓
Tool Calls Detected (t=2000ms)
     ↓
Tool Execution (t=2100-2500ms)
     │
     ├─ Database Query (t=50ms)
     ├─ API Call (t=200ms)
     └─ Result Format (t=10ms)
     ↓
Continue Stream (t=2500-4000ms)
     ↓
Complete (t=4000ms)

Total Time: ~4 seconds for complex multi-tool request
First Response: ~200ms (excellent UX)
```

## 🎯 Error Handling Flow

```
┌────────────────────────────────────────────────────────────┐
│                ERROR RECOVERY                               │
└────────────────────────────────────────────────────────────┘

Error Occurs
     ↓
     ├─ API Error
     │     ↓
     │  Catch in route.ts
     │     ↓
     │  Return error response
     │     ↓
     │  UI shows error toast
     │     ↓
     │  Agent suggests retry
     │
     ├─ Tool Error
     │     ↓
     │  Catch in tool-executor.ts
     │     ↓
     │  Return { success: false, error: "..." }
     │     ↓
     │  AI Brain sees error
     │     ↓
     │  Suggests alternative approach
     │
     ├─ Network Error
     │     ↓
     │  Catch in component
     │     ↓
     │  Show retry button
     │     ↓
     │  Maintain conversation state
     │
     └─ Stream Error
           ↓
        Detect incomplete stream
           ↓
        Show partial response
           ↓
        Offer retry option
```

## 🎉 Success Path

```
User types → Auth OK → AI Brain thinks → Tools execute → 
Stream response → UI updates → Task complete → User satisfied!

                    ✨ MAGIC HAPPENS ✨
```

---

**Note**: This diagram shows the complete flow of a typical agent interaction. The actual implementation handles many edge cases, error conditions, and optimizations not shown here for clarity.
