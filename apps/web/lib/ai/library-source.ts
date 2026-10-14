import type {ScopedRevision} from "./scoped-revision.ts";
import type {DocumentPresentation} from "./document-presentation.ts";
import type {CreatedArtifact} from "./artifact-runner.ts";
export type LibrarySource={artifactId?:string;documentId?:string;name:string;scope?:ScopedRevision;presentation?:DocumentPresentation;format:CreatedArtifact["format"]|"text"};
