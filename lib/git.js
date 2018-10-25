const { execSync } = require('child_process');
const { existsSync } = require('fs');

class Git {

  isRepo() {
    return existsSync('.git');
  }

  getTopLevel() {
    const cmd = 'git rev-parse --show-toplevel';
    return execSync(cmd).toString().trim();
  }

  reflog(grep) {
    let cmd = `git reflog -n 1 --date=iso-strict`;
    if (grep) {
      cmd += ` --grep-reflog="${grep}"`;
    }
    return execSync(cmd).toString().trim();
  }

  currentBranchName() {
    const cmd = 'git symbolic-ref --short HEAD';
    return execSync(cmd).toString().trim();
  }

};

module.exports = Git;
