# Public framework boundary

This repository is a public, reusable AI Brain framework. Keep its contents generic.
Do not store personal knowledge corpora, research-run records, project memory,
or user-specific agent wiring here. The presence of an `AI Brain/` folder does
not make this repository a private vault.

Before writing private brain content, resolve the user-authorized private vault
and verify its exact repository identity and current private visibility with
authenticated GitHub metadata. If that destination cannot be verified, stop
without writing; never fall back to this public repository.

For this owner, the only authorized destination is private
`aaldere1/obsidian-personal`. The public `brain.mjs` and skill hook are guarded
launchers into that vault, not local writers. Run all startup, closeout, daily,
agent installation, and Git sync work from the verified private checkout.
