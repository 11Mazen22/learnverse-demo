import type {DocumentPresentation} from "./document-presentation.ts";
import type {CreatedArtifact} from "./artifact-runner.ts";
export type LibrarySource={artifactId?:string;documentId?:string;name:string;presentation?:DocumentPresentation;format:CreatedArtifact["format"]|"text"};
