# Fix Git Issue Command

This command helps you systematically fix GitHub issues by following a structured workflow.

## Usage
```
/fix-git-issue <issue-number>
```

## Process

Follow these steps:

1. Use `gh issue view` to get the issue details
2. Understand the problem described in the issue
3. Search the codebase for relevant files
4. Implement the necessary changes to fix the issue
5. Write and run tests to verify the fix
6. Ensure code passes linting and type checking
7. Create a descriptive commit message
8. Push and create a PR

Remember to use the GitHub CLI (`gh`) for all GitHub-related tasks.

## Example Workflow

1. **Get issue details:**
   ```bash
   gh issue view <issue-number>
   ```

2. **Search codebase:**
   - Use grep/search tools to find relevant files
   - Understand the current implementation

3. **Implement fix:**
   - Make necessary code changes
   - Follow existing code patterns and conventions

4. **Test the fix:**
   - Run existing tests
   - Write new tests if needed
   - Verify the fix works as expected

5. **Code quality checks:**
   - Run linting (if configured)
   - Run type checking (if configured)
   - Ensure all checks pass

6. **Create PR:**
   - Commit changes with descriptive message
   - Push to new branch
   - Create pull request with `gh pr create`