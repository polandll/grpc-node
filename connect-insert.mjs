#!/usr/bin/env zx

import * as grpc from "@grpc/grpc-js";
import { StargateClient, StargateTableBasedToken, Query, Batch, BatchQuery, Response, promisifyStargateClient } from "@stargate-oss/stargate-grpc-node-client";

try {
    const auth_endpoint = "http://localhost:8081/v1/auth";
    const username = "cassandra";
    const password = "cassandra";

    const stargate_uri = "localhost:8090";

    // Create a table based auth token Stargate/Cassandra authentication using the default C* username and password
    const credentials = new StargateTableBasedToken({authEndpoint: auth_endpoint, username: username, password: password});

    // Create the gRPC client, passing it the address of the gRPC endpoint
    const stargateClient = new StargateClient(stargate_uri, grpc.credentials.createInsecure());
    console.log("made client");

    // Create a promisified version of the client, so we don't need to use callbacks
    const promisifiedClient = promisifyStargateClient(stargateClient);
    console.log("promisified client")
    
    const authenticationMetadata = await credentials.generateMetadata({service_url: auth_endpoint});

    // Create a new keyspace
    const createKeyspaceStatement = new Query();
    createKeyspaceStatement.setCql("CREATE KEYSPACE IF NOT EXISTS test WITH REPLICATION = {'class' : 'SimpleStrategy', 'replication_factor' : 1};");

    await promisifiedClient.executeQuery(createKeyspaceStatement, authenticationMetadata);
    console.log("made keyspace");

    // Create a new table
    const createTableStatement = new Query();
    createTableStatement.setCql("CREATE TABLE IF NOT EXISTS test.users (firstname text PRIMARY KEY,lastname text);");

    await promisifiedClient.executeQuery(createTableStatement, authenticationMetadata);
    console.log("made table");
    
    // INSERT two rows/records
    const insertOne = new BatchQuery();
    const insertTwo = new BatchQuery();

    insertOne.setCql(`INSERT INTO test.users (firstname, lastname) VALUES('Lorina', 'Poland')`);
    insertTwo.setCql(`INSERT INTO test.users (firstname, lastname) VALUES('Doug', 'Wettlaufer')`);

    // Execute the batch
    const batch = new Batch();
    batch.setQueriesList([insertOne, insertTwo]);

    const batchResult = await promisifiedClient.executeBatch(
      batch,
      authenticationMetadata
    );
    console.log("inserted data");
    
  } catch (e) {
    console.log(e);
  }