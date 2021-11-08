#!/usr/bin/env zx

import * as grpc from "@grpc/grpc-js";
import { StargateClient, StargateBearerToken, Query, Batch, BatchQuery, Response, promisifyStargateClient } from "@stargate-oss/stargate-grpc-node-client";

try {

    // Astra DB configuration
    const astra_uri = "0ba933af-90c2-46e9-887a-a387ba75411b-westus2.apps.astra-dev.datastax.com:443";
    const bearer_token = "AstraCS:YUskXkABjYztQJfTHNkOGHOI:09fa16889d7217b23b3854d3b2858a17b895ec272494a1539e47200b87567f26";

    // Set up the authenication 
    // For Astra DB: Enter a bearer token for Astra, downloaded from the Astra DB dashboard
    const bearerToken = new StargateBearerToken(bearer_token);
    const credentials = grpc.credentials.combineChannelCredentials(grpc.credentials.createSsl(), bearerToken);
    
    // console.log(credentials);

    // Create the gRPC client
    // For Astra DB: passing the credentials created above
    const stargateClient = new StargateClient(astra_uri, credentials);
    
    console.log("made client");

    // Create a promisified version of the client, so we don't need to use callbacks
    const promisifiedClient = promisifyStargateClient(stargateClient);
    
    console.log("promisified client")

    // For Astra DB:  create  a keyspace in the Astra DB dashboard

    // For Astra DB: Create a new table
    const createTableStatement = new Query();
    // Set the CQL statement
    createTableStatement.setCql("CREATE TABLE IF NOT EXISTS test.users (firstname text PRIMARY KEY, lastname text);");

    await promisifiedClient.executeQuery(
      createTableStatement
    );

    console.log("created table");

    // For Astra DB: INSERT two rows/records
    // Create two queries that will be run in a batch statement
    const insertOne = new BatchQuery();
    const insertTwo = new BatchQuery();

    // Set the CQL statement
    insertOne.setCql(`INSERT INTO test.users (firstname, lastname) VALUES('Lorina', 'Poland')`);
    insertTwo.setCql(`INSERT INTO test.users (firstname, lastname) VALUES('Doug', 'Wettlaufer')`);

    // Define the new batch to include the 2 insertions
    const batch = new Batch();
    batch.setQueriesList([insertOne, insertTwo]);

    // For Astra DB: execute the batch statement 
    const batchResult = await promisifiedClient.executeBatch(
      batch
    );
    console.log("inserted data");

    // For Astra DB: SELECT the data to read from the table
    const query = new Query();
    const queryString = 'SELECT firstname, lastname FROM test.users;'
    // Set the CQL statement using the string defined in the last line
    query.setCql(queryString);

    // For  Astra DB: execute the query statement
    const response = await promisifiedClient.executeQuery(
      query
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


