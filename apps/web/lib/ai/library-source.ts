import type {CreatedArtifact} from "./artifact-runner.ts";
export type LibrarySource={artifactId?:string;documentId?:string;name:string;format:CreatedArtifact["format"]|"text"};
