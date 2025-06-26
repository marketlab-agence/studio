export const TUTORIALS = [
  {
    id: 'intro-to-git',
    title: 'Introduction to Git',
    description: 'Learn the very basics of Git and how to start a new project.',
    steps: [
      {
        id: '1-1',
        title: 'Initialize a Repository',
        content: 'Every Git project lives in a repository. To start one, use the `git init` command.',
        command: 'git init',
      },
      {
        id: '1-2',
        title: 'Check the Status',
        content: 'The `git status` command shows the current state of your repository. It tells you about untracked files, changes, and more.',
        command: 'git status',
      },
    ],
  },
  {
    id: 'making-commits',
    title: 'Making Commits',
    description: 'Learn how to save your changes by making commits.',
    steps: [
      {
        id: '2-1',
        title: 'Staging Files',
        content: "Before committing, you need to 'stage' your changes. This tells Git which changes you want to include in the next commit. Use `git add`.",
        command: 'git add README.md',
      },
      {
        id: '2-2',
        title: 'Committing Changes',
        content: 'A commit is a snapshot of your staged changes. Each commit has a unique ID and a message. Use `git commit -m "Your message"` to create one.',
        command: 'git commit -m "Initial commit"',
      },
      {
        id: '2-3',
        title: 'Viewing History',
        content: 'You can see the history of all your commits using the `git log` command. This shows who made the change, when, and their commit message.',
        command: 'git log',
      },
    ],
  },
  {
    id: 'branching',
    title: 'Branching and Merging',
    description: 'Understand how to work on different features in parallel using branches.',
    steps: [
      {
        id: '3-1',
        title: 'Create a New Branch',
        content: "Branches allow you to develop features without affecting the main codebase. Create a new branch with `git branch <branch-name>`.",
        command: 'git branch new-feature',
      },
      {
        id: '3-2',
        title: 'Switch to a Branch',
        content: "To start working on your new branch, you need to switch to it using `git checkout <branch-name>` or `git switch <branch-name>`.",
        command: 'git switch new-feature',
      },
      {
        id: '3-3',
        title: 'Merge a Branch',
        content: "Once your feature is complete, you can merge it back into your main branch (e.g., `main` or `master`). First, switch back to the main branch.",
        command: 'git switch main',
      },
      {
        id: '3-4',
        title: 'Perform the Merge',
        content: "Now, use `git merge <branch-name>` to combine the changes from your feature branch into the current branch.",
        command: 'git merge new-feature',
      },
    ],
  },
];
