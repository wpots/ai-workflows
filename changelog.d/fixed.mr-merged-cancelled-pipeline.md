- `skills/mr-merged` Step 5: a cancelled pipeline on the merge commit, with its
  deploy job never started, is read as superseded by a later push. The
  read-back follows the oldest later pipeline on the target branch that
  contains the merge commit and reads that deploy log. Before, the deploy
  looked missing while the next push had deployed it.
