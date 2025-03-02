import * as tl from "azure-pipelines-task-lib/task";

async function run() {
  const testParam = tl.getInput("testParam", true);
  console.log("Starting Task...");
  console.log(`Test Param: ${testParam}`);
}

void run();
