"""
Tool Definitions for Agent
OpenAI function calling format, compatible with Claude
"""

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "execute_python",
            "description": """Execute Python code in the sandbox. Use this for:
- Data processing and analysis
- Web scraping with requests/beautifulsoup
- File operations
- Mathematical calculations
- API calls
- Any complex logic

The sandbox has Python 3.11 with common libraries: requests, beautifulsoup4, pandas, numpy, matplotlib, etc.
Import libraries as needed. Code will be executed in /workspace directory.""",
            "parameters": {
                "type": "object",
                "properties": {
                    "code": {
                        "type": "string",
                        "description": "Python code to execute. Can be multi-line."
                    }
                },
                "required": ["code"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "shell_command",
            "description": """Execute a shell command in the sandbox. Use for:
- File system operations (ls, mkdir, mv, etc.)
- Installing packages (pip install, apt-get)
- Running system utilities (curl, wget, grep)
- Git operations

The sandbox is Ubuntu Linux. You have sudo access. Use -y flag for non-interactive installs.""",
            "parameters": {
                "type": "object",
                "properties": {
                    "command": {
                        "type": "string",
                        "description": "Shell command to execute"
                    }
                },
                "required": ["command"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "browser_navigate",
            "description": """Control a headless browser (Chromium via Playwright). Use for:
- Navigating to websites
- Extracting text content
- Taking screenshots
- Clicking elements
- Filling forms
- Scraping dynamic content (JavaScript-rendered pages)

The browser maintains session state across calls.""",
            "parameters": {
                "type": "object",
                "properties": {
                    "url": {
                        "type": "string",
                        "description": "URL to navigate to"
                    },
                    "action": {
                        "type": "string",
                        "enum": ["navigate", "get_text", "screenshot", "click", "fill_form", "extract_links"],
                        "description": "Action to perform"
                    },
                    "selector": {
                        "type": "string",
                        "description": "CSS selector for click/fill actions (optional)"
                    },
                    "value": {
                        "type": "string",
                        "description": "Value to fill in form (optional)"
                    }
                },
                "required": ["url", "action"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "web_search",
            "description": """Search the web using Brave Search API. Returns top search results with titles, URLs, and descriptions.
Use this to find current information, research topics, discover websites, etc.""",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Search query"
                    },
                    "num_results": {
                        "type": "integer",
                        "description": "Number of results to return (default: 5)",
                        "default": 5
                    }
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "save_file",
            "description": """Save content to a file in the workspace. Use for:
- Saving scraped data
- Creating reports
- Storing intermediate results
- Writing code/scripts

Files are persistent for the duration of the task.""",
            "parameters": {
                "type": "object",
                "properties": {
                    "filename": {
                        "type": "string",
                        "description": "Filename to save (e.g., 'report.md', 'data.json')"
                    },
                    "content": {
                        "type": "string",
                        "description": "Content to write to file"
                    }
                },
                "required": ["filename", "content"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "read_file",
            "description": """Read content from a file in the workspace. Use to:
- Check previously saved data
- Read intermediate results
- Load configuration

Returns file content as string.""",
            "parameters": {
                "type": "object",
                "properties": {
                    "filename": {
                        "type": "string",
                        "description": "Filename to read"
                    }
                },
                "required": ["filename"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "complete",
            "description": """Mark the task as complete. Use when:
- All steps in the plan are finished
- The deliverable is ready
- No more actions are needed

Include a summary of what was accomplished.""",
            "parameters": {
                "type": "object",
                "properties": {
                    "summary": {
                        "type": "string",
                        "description": "Summary of task completion and results"
                    },
                    "output_files": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "List of output files created"
                    }
                },
                "required": ["summary"]
            }
        }
    }
]
