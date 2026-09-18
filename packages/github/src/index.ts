import { Octokit } from 'octokit';
/** Construction only. Provider operations belong in future explicitly designed methods. */
export interface GitHubAdapter { readonly provider: 'github' }
export function createGitHubAdapter(): GitHubAdapter {
  const client = new Octokit();
  // Keep provider client private; do not expose a generic request proxy.
  void client;
  return Object.freeze({ provider: 'github' });
}
