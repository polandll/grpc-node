# grpc-node

This repository includes a package-lock.json file and 
three code files that will create a keyspace (optional), create a table,
insert some data, and selects that newly-created data.

`./connect.mjs`, `./connect-sgoss.mjs`, and `./connect-astra.mjs`
are the commands to run. You may need to chmod the file `chmod +x connect.mjs` 
before executing.

You must install `zx` first: Install with `npm i -g zx`.
See: https://github.com/google/zx
