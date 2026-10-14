export type DocumentStyle="classic"|"editorial"|"forest";
export function documentStyle(value:unknown){return value==="editorial"?{ink:"273345",accent:"704A27",soft:"F5EFE7"}:value==="forest"?{ink:"143E32",accent:"22654C",soft:"EDF5EF"}:{ink:"081A3D",accent:"07285A",soft:"EDF6FF"};}
