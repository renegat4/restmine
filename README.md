# restmine

Link git to Redmine:

* add refs-tags to commits so commits are linked to issues
* take-over issues (set assigned to, status, category) on checkout
* log time spent on issues


## usage

First create an issue in Redmine as usual. Then checkout a branch with a name
like `iss1234`. 1234 is the issue id and `iss` is the default prefix for an
issue you work on. `restmine` will now assign the issue to you, set its status
to assigned and set the category. While working on this branch restmine will
automatically append `refs #1234` to each commit. When the commits get pushed
to the repository (which is configured in redmine), redmine will scan the
commits and link them to issue #1234.

When the work is done, checkout master again. Now restmine will log the time
spent on that issue in redmine with the configured activity id.


The prefix `iss` is the default which triggers the take-over of an issue. You
are free to configure other prefixes with individual activity ids, but only
`iss` will trigger the take-over.


## setup

    $ rr setup

This will install the required hooks (commit-msg, post-checkout). Existing
hooks will be renamed. In windows the user needs the
`SeCreateSymbolicLinkPrivilege` privilege. Or run the command as administrator.
See: (https://ember-cli.com/user-guide/#enabling-symlinks)

Besides that an `.restmine.json`-file will be created. This file contains
restmines configuration.

    {
      "host": "hostname where redmine is installed (redmine.example.com)",
        "https": boolean (true ->use https),
        "key": the users API-key,
        "userid": the users id in redmine,
        "edit_id": the id of 'assigned' status,
        "category_id": the category id which will be set on take-over,
        "iss_activityid": the activity id for time logged on issues,
        "org_activityid": activity id for time logged on 'orga'-issues
    }

`iss_activityid` is required. `org_activityid` is an example.

(Currently you need to find the `category_id` and `activity_id` by examining
the redmine website. For a list of statuses there is `rr statuses`.)

## issue-branches

restmine will only become active when it recognises an issue-branch.

Issue-branches need to be named like (RegExp):

    ^([a-zA-Z]{3})(\d+)$

This is three characters followed by a number.

The characters correspond to the configured `..._activityid`
and the number is the issue id.

# Show an issue

restmine can show the current issue:

    $ rr

Or an arbitrary one:

    $ rr show 1234

