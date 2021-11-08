#!/usr/bin/env zx

import * as grpc from "@grpc/grpc-js";
import { StargateClient, StargateTableBasedToken, Query, Batch, BatchQuery, Response, promisifyStargateClient } from "@stargate-oss/stargate-grpc-node-client";
//import { StargateClient, StargateBearerToken, Query, Batch, BatchQuery, Response, promisifyStargateClient } from "@stargate-oss/stargate-grpc-node-client";

try {
    // Stargate OSS configuration for locally hosted docker image
    const auth_endpoint = "http://localhost:8081/v1/auth";
    const username = "cassandra";
    const password = "cassandra";
    const stargate_uri = "localhost:8090";

    // Astra DB configuration
    //const astra_uri = "0ba933af-90c2-46e9-887a-a387ba75411b-westus2.apps.astra-dev.datastax.com:443";
    //const bearer_token = "AstraCS:YUskXkABjYztQJfTHNkOGHOI:09fa16889d7217b23b3854d3b2858a17b895ec272494a1539e47200b87567f26";

    // Set up the authenication 
    // For Stargate OSS: Create a table based auth token Stargate/Cassandra authentication using the default C* username and password
    const credentials = new StargateTableBasedToken({authEndpoint: auth_endpoint, username: username, password: password});
    // For Astra DB: Enter a bearer token for Astra, downloaded from the Astra DB dashboard
    // const bearerToken = new StargateBearerToken(bearer_token);
    // const credentials = grpc.credentials.combineChannelCredentials(grpc.credentials.createSsl(), bearerToken);
    
    // console.log(credentials);

    // Create the gRPC client
    // For Stargate OSS: passing it the address of the gRPC endpoint
    const stargateClient = new StargateClient(stargate_uri, grpc.credentials.createInsecure());
    // For Astra DB: passing the credentials created above
    //const stargateClient = new StargateClient(astra_uri, credentials);
    
    console.log("made client");

    // Create a promisified version of the client, so we don't need to use callbacks
    const promisifiedClient = promisifyStargateClient(stargateClient);
    
    console.log("promisified client")
    
    // For Stargate OSS: generate authentication metadata that is passed in the executeQuery and executeBatch statements
    // For Astra DB: comment out
    const authenticationMetadata = await credentials.generateMetadata({service_url: auth_endpoint});

    // For Stargate OSS: Create a new keyspace
    // For Astra DB: comment out, and create  a keyspace in the Astra DB dashboard
    const createKeyspaceStatement = new Query();
    // Set the CQL statement
    createKeyspaceStatement.setCql("CREATE KEYSPACE IF NOT EXISTS test WITH REPLICATION = {'class' : 'SimpleStrategy', 'replication_factor' : 1};");

    await promisifiedClient.executeQuery(createKeyspaceStatement, authenticationMetadata);

    console.log("created keyspace");

    // For Stargate OSS and Astra DB: Create a new table
    const createTableStatement = new Query();
    // Set the CQL statement
    createTableStatement.setCql("CREATE TABLE IF NOT EXISTS test.users (firstname text PRIMARY KEY, lastname text);");

    // For Astra DB: delete authenticationMetadata from the following executeQuery statement 
    await promisifiedClient.executeQuery(
      createTableStatement,
      authenticationMetadata
    );

    console.log("created table");

    // For Stargate OSS and Astra DB: INSERT two rows/records
    // Create two queries that will be run in a batch statement
    const insertOne = new BatchQuery();
    const insertTwo = new BatchQuery();

    // Set the CQL statement
    insertOne.setCql(`INSERT INTO test.users (firstname, lastname) VALUES('Lorina', 'Poland')`);
    insertTwo.setCql(`INSERT INTO test.users (firstname, lastname) VALUES('Doug', 'Wettlaufer')`);

    // Define the new batch to include the 2 insertions
    const batch = new Batch();
    batch.setQueriesList([insertOne, insertTwo]);

    // For Stargate OSS and Astra DB: execute the batch statement
    // For Astra DB: delete authenticationMetadata from the following executeQuery statement 
    const batchResult = await promisifiedClient.executeBatch(
      batch,
      authenticationMetadata
    );
    console.log("inserted data");

    // For Stargate OSS and Astra DB: SELECT the data to read from the table
    const query = new Query();
    const queryString = 'SELECT firstname, lastname FROM test.users;'
    // Set the CQL statement using the string defined in the last line
    query.setCql(queryString);

    // For Stargate OSS and Astra DB: execute the query statement
    // For Astra DB: delete authenticationMetadata from the following executeQuery statement 
    const response = await promisifiedClient.executeQuery(
      query,
      authenticationMetadata
    );

    console.log("select executed")

    // Get the results from the execute query statement
    // and separate into an array to print out the results
    const resultSet = response.getResultSet();
    const rows = resultSet.getRowsList();

    // This for loop gets 2 results
    for ( let i = 0; i < 2; i++) {
      var valueToPrint = "";
      for ( let j = 0; j < 2; j++) {
        var value = rows[i].getValuesList()[j].getString();
        valueToPrint += value;
        valueToPrint += " ";
      }
      console.log(valueToPrint);
    }

    console.log("everything worked!")
  } catch (e) {
    // Print out any errors that occur while running this script
    console.log(e);
  }

