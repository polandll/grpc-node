#!/usr/bin/env zx

import * as grpc from "@grpc/grpc-js";
import { StargateClient, StargateTableBasedToken, Query, Response, promisifyStargateClient } from "@stargate-oss/stargate-grpc-node-client";
//import { StargateClient, StargateBearerToken, Query, Response, promisifyStargateClient } from "@stargate-oss/stargate-grpc-node-client";

try {
    const auth_endpoint = "http://localhost:8081/v1/auth";
    const username = "cassandra";
    const password = "cassandra";
    //const bearer_token = "AstraCS:uuwizlOZhGxrUxaOqHPLAGCK:b4296e99a9f801d78043272b0efd79dca115b1fd95765780df36ed3ada87ff9b";
    const bearer_token = "AstraCS:qTvPRvZTLygyfEZynXIRcOrs:cbd02f55e76e6e948673e8127bbf81feeb6a5564ccfe1f513cf73b9409cf70ed";

    const stargate_uri = "localhost:8090";
    // const astra_uri = "a2b4465c-e7a4-4cb7-a4a4-c829f0ef10d6-us-west1.apps.astra.datastax.com:443";
    const astra_uri = "ff1d03c6-aaae-440c-b463-4508b2993d0f-us-east1.apps.astra-dev.datastax.com:443";

    // Create a table based auth token Stargate/Cassandra authentication using the default C* username and password
    const credentials = new StargateTableBasedToken({authEndpoint: auth_endpoint, username: username, password: password});
    // Enter a bearer token for Astra
    // const bearerToken = new StargateBearerToken(bearer_token);
    // const credentials = grpc.credentials.combineChannelCredentials(grpc.credentials.createSsl(), bearerToken);
    // console.log(credentials);

    // Create the gRPC client, passing it the address of the gRPC endpoint
    const stargateClient = new StargateClient(stargate_uri, grpc.credentials.createInsecure());
    //const stargateClient = new StargateClient(astra_uri, credentials);
    console.log("made client");


    // Create a promisified version of the client, so we don't need to use callbacks
    const promisifiedClient = promisifyStargateClient(stargateClient);
    console.log("promisified client")
    
    const authenticationMetadata = await credentials.generateMetadata({service_url: auth_endpoint});

    // Create a new keyspace
    const createKeyspaceStatement = new Query();
    createKeyspaceStatement.setCql("CREATE KEYSPACE IF NOT EXISTS test WITH REPLICATION = {'class' : 'SimpleStrategy', 'replication_factor' : 1};");

    await promisifiedClient.executeQuery(createKeyspaceStatement, authenticationMetadata);

    // Create a new table
    const createTableStatement = new Query();
    createTableStatement.setCql("CREATE TABLE IF NOT EXISTS test.users (key text PRIMARY KEY,value text);");

    await promisifiedClient.executeQuery(createTableStatement, authenticationMetadata);

    // INSERT two rows/records
    // const insertOne = new BatchQuery();
    // const insertTwo = new BatchQuery();

    // insertOne.setCql(`INSERT INTO test.users (firstname, lastname) VALUES('Lorina', 'Poland')`);
    // insertTwo.setCql(`INSERT INTO test.users (firstname, lastname) VALUES('Doug', 'Wettlaufer')`);

    // // Execute the batch
    // const batch = new Batch();
    // batch.setQueriesList([insertOne, insertTwo]);

    // const batchResult = await promisifiedClient.executeBatch(
    //   batch,
    //   authenticationMetadata
    // );
    // console.log("inserted data");

    const queryString = 'SELECT firstname, lastname FROM test.users;'
    const query = new Query();
    query.setCql(queryString);
    //console.log(queryString);

    const response = await promisifiedClient.executeQuery(
      query,
      authenticationMetadata
    );
    console.log("select executed")

    const resultSet = response.getResultSet();
    const rows = resultSet.getRowsList();

    for ( let i = 0; i < 2; i++) {
      var valueToPrint = "";
      for ( let j = 0; j < 2; j++) {
        var value = rows[i].getValuesList()[j].getString();
        valueToPrint += value;
        valueToPrint += " ";
      }
    }
  } catch (e) {
    // something went wrong
  }

