// import path from "path";
// import { container } from "tsyringe";
// import fs from "fs";

// export async function registerRepositories(directory: string) {
//   const files = fs.readdirSync(directory);

//   for (const file of files) {
//     const filePath = path.join(directory, file);
//     const stat = fs.statSync(filePath);

//     if (stat.isDirectory()) {
//       await registerRepositories(filePath);
//     } else if (file.endsWith("Repository.ts")) {
//       const repositoryPath = filePath;

//       if (!file.startsWith("I")) {
//         try {
//           const module = await import(repositoryPath);
//           const repositoryName = file.replace(".ts", "");
//           const repository = module[repositoryName];

//           const interfaceName = `I${repositoryName}`;

//           if (module[interfaceName]) {
//             container.registerSingleton(
//               module[interfaceName],
//               new repository()
//             );
//             console.log(`Registered: ${interfaceName} -> ${repositoryName}`);
//           } else {
//             console.warn(
//               `Interface ${interfaceName} not found for ${repositoryName}`
//             );
//           }
//         } catch (error) {
//           console.error(
//             `Failed to register repository from ${repositoryPath}:`,
//             error
//           );
//         }
//       }
//     }
//   }
// }

// const basePath = path.resolve(__dirname, "..", "..", "modules");
// registerRepositories(basePath).catch(console.error);
