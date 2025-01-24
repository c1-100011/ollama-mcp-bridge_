# Available Tools

| Tool Name | Description | Required Parameters | Optional Parameters |
|-----------|-------------|-------------------|-------------------|
| add_observations | Add new observations to existing entities in the knowledge graph | - observations: Array of {entityName: string, contents: string[]} | None |
| delete_entities | Delete multiple entities and their associated relations | - entityNames: string[] | None |
| delete_observations | Delete specific observations from entities | - deletions: Array of {entityName: string, observations: string[]} | None |
| delete_relations | Delete multiple relations from the knowledge graph | - relations: Array of {from: string, to: string, relationType: string} | None |
| read_graph | Read the entire knowledge graph | None | None |
| search_nodes | Search for nodes based on a query | - query: string | None |
| open_nodes | Open specific nodes by their names | - names: string[] | None |
| brave_web_search | Performs a web search using Brave Search API | - query: string (max 400 chars, 50 words) | - count: number (1-20, default 10)<br>- offset: number (max 9, default 0) |
| brave_local_search | Searches for local businesses and places | - query: string | - count: number (1-20, default 5) |
| create_or_update_file | Create or update a file in GitHub | - owner: string<br>- repo: string<br>- path: string<br>- content: string<br>- message: string<br>- branch: string | - sha: string (required for updates) |
| search_repositories | Search for GitHub repositories | - query: string | - page: number<br>- perPage: number (max 100) |
| create_repository | Create a new GitHub repository | - name: string | - description: string<br>- private: boolean<br>- autoInit: boolean |
| get_file_contents | Get contents from GitHub repo | - owner: string<br>- repo: string<br>- path: string | - branch: string |
| push_files | Push multiple files to GitHub | - owner: string<br>- repo: string<br>- branch: string<br>- files: Array of {path: string, content: string}<br>- message: string | None |
| create_issue | Create a GitHub issue | - owner: string<br>- repo: string<br>- title: string | - body: string<br>- assignees: string[]<br>- milestone: number<br>- labels: string[] |
| create_pull_request | Create a GitHub PR | - owner: string<br>- repo: string<br>- title: string<br>- head: string<br>- base: string | - body: string<br>- draft: boolean<br>- maintainer_can_modify: boolean |
| fork_repository | Fork a GitHub repository | - owner: string<br>- repo: string | - organization: string |
| create_branch | Create a new branch | - owner: string<br>- repo: string<br>- branch: string | - from_branch: string |
| list_commits | Get commits of a branch | - owner: string<br>- repo: string | - sha: string<br>- page: number<br>- perPage: number |
| list_issues | List GitHub issues | - owner: string<br>- repo: string | - direction: "asc"/"desc"<br>- labels: string[]<br>- page: number<br>- per_page: number<br>- since: string<br>- sort: "created"/"updated"/"comments"<br>- state: "open"/"closed"/"all" |
| update_issue | Update a GitHub issue | - owner: string<br>- repo: string<br>- issue_number: number | - title: string<br>- body: string<br>- assignees: string[]<br>- milestone: number<br>- labels: string[]<br>- state: "open"/"closed" |
| add_issue_comment | Add comment to issue | - owner: string<br>- repo: string<br>- issue_number: number<br>- body: string | None |
| search_code | Search code on GitHub | - q: string | - order: "asc"/"desc"<br>- page: number (min 1)<br>- per_page: number (1-100) |
| search_issues | Search GitHub issues/PRs | - q: string | - order: "asc"/"desc"<br>- page: number (min 1)<br>- per_page: number (1-100)<br>- sort: various options |
| search_users | Search GitHub users | - q: string | - order: "asc"/"desc"<br>- page: number (min 1)<br>- per_page: number (1-100)<br>- sort: "followers"/"repositories"/"joined" |
| get_issue | Get GitHub issue details | - owner: string<br>- repo: string<br>- issue_number: number | None |
| init | Initialize context directory | - path: string (default: ".context") | None |
| validate | Validate context directory | - path: string (default: ".context") | None |
| context | Get context from index.md | - path: string (default: ".context") | - raw: boolean (default: false) |
| diagrams | List Mermaid diagrams | - path: string (default: ".context") | - content: boolean (default: false) |
