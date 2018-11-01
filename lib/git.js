const { execSync } = require('child_process');
const { existsSync } = require('fs');

class Git {

  isRepo() {
    return existsSync('.git');
  }

  exec(cmd) {
    return execSync(cmd).toString().trim();
  }

  getTopLevel() {
    const cmd = 'git rev-parse --show-toplevel';
    return exec(cmd);
  }

  reflog(grep) {
    let cmd = `git reflog -n 1 --date=iso-strict`;
    if (grep) {
      cmd += ` --grep-reflog="${grep}"`;
    }
    return exec(cmd);
  }

  currentBranchName() {
    const cmd = 'git symbolic-ref --short HEAD';
    return exec(cmd);
  }

}

module.exports = Git;
