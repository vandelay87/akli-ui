#!/usr/bin/env bash
# Invoked by .github/workflows/release.yml as changesets/action's `publish-script`,
# only when there are no pending changesets — i.e. once the "Version Packages" PR
# (opened by that same action) has just been merged to main.
#
# This intentionally does NOT call `changeset publish`. changesets/action's default
# publish command auto-detects the workspace's package manager (this repo has no
# override for that) and, since this repo uses pnpm, would shell out to
# `pnpm publish` instead of `npm publish`. npm trusted publishing (OIDC) is
# implemented in the npm CLI itself; pnpm's own native OIDC support is newer and has
# had real regressions (pnpm/pnpm#11513 — an unresolved `${NODE_AUTH_TOKEN}`
# placeholder written to .npmrc by actions/setup-node caused OIDC publishes to send a
# literal, invalid Authorization header and fail with a 404). Calling `npm publish`
# directly avoids depending on that.
#
# Because this bypasses `changeset publish`, its "skip if this version is already on
# npm" safety check is replicated by hand below — on every push to main with no
# pending changesets (the common case: a regular PR merged without a changeset),
# this script still runs, and must be a no-op rather than fail on a duplicate publish.
set -euo pipefail

package_name="$(node -p "require('./package.json').name")"
current_version="$(node -p "require('./package.json').version")"
# Matches @changesets/cli's own tag format for a single-package ("root" tool type)
# repo — see node_modules/@changesets/cli/dist/gitTags.mjs's buildGitTag.
release_tag="v${current_version}"

if npm view "${package_name}@${current_version}" version >/dev/null 2>&1; then
  echo "${package_name}@${current_version} is already published to npm."
else
  # Only needed on this branch — the npm CLI's trusted-publishing (OIDC) support
  # matters for `npm publish`, not for the read-only `npm view` check above.
  # Version floor matches package.json's engines.npm.
  npm install -g npm@12.0.2
  pnpm build
  npm publish
fi

# Checked independently from the npm-publish guard above, not gated behind it — a
# run where `npm publish` succeeds but this step fails (network blip, job
# interruption) must still push the tag on retry, not silently no-op just because
# the package is already on npm.
#
# changeset publish also creates + pushes a git tag for the released version; since
# this script bypasses it, that's replicated explicitly here (`changeset git-tag`
# reads package.json only — it makes no registry calls, so it isn't affected by the
# pnpm/OIDC issue above).
if git ls-remote --exit-code --tags origin "refs/tags/${release_tag}" >/dev/null 2>&1; then
  echo "Tag ${release_tag} already exists on origin."
else
  pnpm exec changeset git-tag
  git push --follow-tags
fi
