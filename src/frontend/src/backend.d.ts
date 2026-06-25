import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type TagId = bigint;
export interface Tag {
    id: TagId;
    name: string;
    color: string;
}
export type Result = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export interface GraphNode {
    id: DocumentId;
    title: string;
}
export interface GraphData {
    edges: Array<GraphEdge>;
    nodes: Array<GraphNode>;
}
export interface BacklinkRef {
    id: DocumentId;
    title: string;
}
export interface DocumentVersion {
    title: string;
    content: string;
    savedAt: bigint;
}
export interface GraphEdge {
    source: DocumentId;
    target: DocumentId;
}
export type Error_ = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export type DocumentId = bigint;
export interface Document {
    id: DocumentId;
    title: string;
    content: string;
    createdAt: bigint;
    tagIds: Array<TagId>;
    updatedAt: bigint;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createDocument(title: string): Promise<Document>;
    createTag(name: string, color: string): Promise<Tag>;
    deleteDocument(id: DocumentId): Promise<void>;
    deleteTag(id: TagId): Promise<void>;
    getAllTags(): Promise<Array<Tag>>;
    getBacklinks(id: DocumentId): Promise<Array<BacklinkRef>>;
    getCallerUserRole(): Promise<UserRole>;
    getDocument(id: DocumentId): Promise<Document | null>;
    getDocumentByTitle(title: string): Promise<Document | null>;
    getDocuments(searchQuery: string, filterTagIds: Array<TagId>, sortBy: string): Promise<Array<Document>>;
    getGraphData(): Promise<GraphData>;
    getProfile(): Promise<UserProfile | null>;
    getVersions(id: DocumentId): Promise<Array<DocumentVersion>>;
    isCallerAdmin(): Promise<boolean>;
    restoreVersion(id: DocumentId, versionIndex: bigint): Promise<Document>;
    saveVersion(id: DocumentId): Promise<void>;
    setProfile(name: string): Promise<void>;
    updateDocument(id: DocumentId, title: string, content: string, tagIds: Array<TagId>): Promise<Document>;
    updateTag(id: TagId, name: string, color: string): Promise<Tag>;
}
