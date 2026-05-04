# ActionScribe AI - Execution Intelligence Platform

**Turn Every Meeting Into Executed Work**

ActionScribe is an AI-powered execution intelligence platform that transforms meeting transcripts and recordings into actionable intelligence. Extract summaries, decisions, tasks, and organizational knowledge graphs from your meetings automatically.

---

## Live Platform

**Frontend (User Interface):** [https://actionscribe.onrender.com](https://action-scribe.vercel.app/)

**Backend API:** [https://actionscribe.onrender.com/api](https://actionscribe.onrender.com)

**Database:** MongoDB Atlas (Cloud)

---

## Core Functionalities

### 1. **Decision Intelligence Registry** 
Store and track every decision made in meetings with full audit history.
- **Extract Decisions Automatically** - AI analyzes meeting transcripts to identify key decisions
- **Audit Trail** - Track who changed what decision, when, and why
- **Decision Status** - Mark decisions as proposed, accepted, rejected, or deferred
- **View in Meetings** - See all decisions linked to their source meeting

**How to Use:**
1. Go to **Meetings** page
2. Select any meeting → scroll to "Decisions" section
3. View AI-extracted decisions or manually add new ones
4. Click "View History" to see changes and who made them

---

### 2. **Semantic Search & Org Memory Chat** 
Find discussions across your entire organization with AI-powered understanding.
- **Smart Search** - Search by keyword or topic; results ranked by relevance
- **Cross-Meeting Context** - See related discussions from different meetings
- **Org Memory Copilot** - Ask natural language questions across all meetings, decisions, and tasks
- **Timeline View** - See chronological order of decisions and tasks in search results

**How to Use:**
1. Go to **Dashboard**
2. Use "Smart Search" box to search (e.g., "pricing strategy", "product roadmap")
3. Results show meetings with relevance score and related items
4. Try "Org Memory Copilot" to ask questions like:
   - "What did we decide about the pricing strategy?"
   - "Which tasks are blocked by design decisions?"
   - "Show me all decisions related to Project X"

---

### 3. **Execution Intelligence Dashboard** 
Real-time visibility into team execution health with risk signals and bottlenecks.
- **Team Productivity Metrics** - Total meetings, tasks, completion rate, ROI per meeting
- **Risk Detection** - Identify overdue tasks, blocked items, overloaded team members
- **Bottleneck Detection** - See which people/topics are slowing down execution
- **Meeting ROI Score** - Measure effectiveness (decisions and tasks generated per meeting hour)
- **Workload Heatmap** - Visual indicator of team capacity and distribution

**How to Use:**
1. Go to **Dashboard**
2. Top section shows productivity metrics
3. Scroll to "Risk Signals" panel to see flagged items
4. See "Workload Distribution" to identify team hotspots
5. "Bottleneck Alerts" shows stuck tasks and slow-moving work

---

### 4. **Knowledge Graph Visualization** 
See your organization's entire decision and execution network as an interactive graph.
- **Node Types** - Meetings, Decisions, Tasks, Team Members
- **Interactive Nodes** - Click any node to see full details
- **Edge Types** - Decision from meeting, Task from meeting, Task linked to decision, Person assigned to task
- **Search Graph** - Filter by keyword to highlight relevant subgraph
- **Meeting Clusters** - Nodes grouped by meeting date for easier navigation

**How to Use:**
1. Go to **Knowledge Graph** (in top navigation)
2. View interactive network of your org's meetings, decisions, tasks, and people
3. Click on any node to see full details in the right panel
4. Hover over edges to see relationship type
5. Use search box to filter graph to specific topics

---

### 5. **Smart Meeting Processing** 
Upload meetings and automatically extract summaries, action items, and decisions.

**Supported Formats:**
- Audio files: MP3, WAV, M4A, WhatsApp audio (.mpeg)
- Text: Plain text transcripts (.txt)
- Documents: PDF, DOCX (extraction pending)

**AI Extraction Pipeline:**
- **Summary** - Concise overview of discussion
- **Tasks** - Action items with assigned owner (from speech analysis)
- **Decisions** - Key decisions made with context
- **Topics** - Agenda items and discussion segments
- **Participants** - Detected speakers (from transcript)

**How to Use:**
1. Go to **Dashboard**
2. Find "Create Meeting" card at top
3. Either paste a transcript OR upload an audio/text file
4. Click "Process Meeting"
5. View extracted summary, tasks, decisions in the result card
6. Go to **Meetings** page to edit or view full details

---

## Additional Features

### Task Management Board
- **Four-stage board** - Pending → In Progress → Blocked → Completed
- **Task details** - Title, description, owner, deadline, priority
- **Quick updates** - Change status or mark complete from the board
- **Follow-up generation** - Generate professional follow-up messages for tasks

### Insights & Analytics Page
- **Team metrics** - Most assigned person, overdue tasks, productivity score
- **Delayed task alerts** - Red-flagged overdue items with owner
- **Meeting frequency trends** - See meeting volume over time
- **Completion rate** - Overall team productivity percentage

### Meeting History & Details
- **Full meeting list** - All past meetings with timestamps
- **Meeting notes** - Edit summary and details
- **Task extraction** - View and edit auto-extracted tasks
- **Discussion topics** - Segmented agenda items with timestamps
- **Participant tracking** - Who attended

### Task Export
- **CSV Export** - Download all tasks in spreadsheet format
---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19 + Vite + Tailwind CSS + React Router |
| **Backend** | Express.js + Mongoose + Node.js |
| **Database** | MongoDB (Atlas) |
| **AI/LLM** | Groq SDK (Llama 3.1 8B) |
| **Auth** | JWT + bcrypt |
| **Hosting** | Vercel (frontend) + Render (backend) + MongoDB Atlas (database) |

---

## API Endpoints (For Developers)

### Meetings
- `POST /api/meetings/create` - Create meeting from transcript
- `POST /api/meetings/upload` - Upload audio/text file
- `GET /api/meetings` - List all meetings
- `GET /api/meetings/:id` - Get meeting details
- `PATCH /api/meetings/:id` - Update meeting
- `DELETE /api/meetings/:id` - Delete meeting

### Decisions
- `POST /api/decisions` - Create decision
- `GET /api/decisions/meeting/:meetingId` - Get decisions for meeting
- `PATCH /api/decisions/:id` - Update decision (with audit trail)
- `GET /api/decisions/:id/history` - Get decision change history

### Tasks
- `GET /api/tasks` - List all tasks
- `PATCH /api/tasks/:id` - Update task
- `PATCH /api/tasks/:id/status` - Change task status
- `PATCH /api/tasks/:id/complete` - Mark task complete

### AI Features
- `GET /ai/search?q=<query>` - Semantic search across org
- `POST /ai/memory-chat` - Ask question across all meetings
- `POST /ai/chat/:meetingId` - Ask question about specific meeting
- `GET /ai/graph` - Get knowledge graph nodes and edges
- `GET /ai/insights` - Get team insights and metrics
- `POST /ai/follow-up/:taskId` - Generate follow-up message

### Analytics
- `GET /analytics/dashboard` - Team metrics and execution intelligence
