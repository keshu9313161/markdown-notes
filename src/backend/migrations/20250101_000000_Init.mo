import Char "mo:core/Char";
import Int "mo:core/Int";
import List "mo:core/List";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Time "mo:core/Time";
import AccessControl "mo:caffeineai-authorization/access-control";

// Generated initial migration: seeds all stable actor state on a fresh
// install. Actor type definitions are inlined so this frozen chain entry
// does not drift if the actor's types change in a later version.
module {
  type UserProfile = {
    name : Text;
  };

  type DocumentId = Nat;

  type TagId = Nat;

  type Document = {
    id : DocumentId;
    title : Text;
    content : Text;
    tagIds : [TagId];
    createdAt : Int;
    updatedAt : Int;
  };

  type DocumentVersion = {
    title : Text;
    content : Text;
    savedAt : Int;
  };

  type Tag = {
    id : TagId;
    name : Text;
    color : Text;
  };

  type BacklinkRef = {
    id : DocumentId;
    title : Text;
  };

  type GraphNode = {
    id : DocumentId;
    title : Text;
  };

  type GraphEdge = {
    source : DocumentId;
    target : DocumentId;
  };

  type GraphData = {
    nodes : [GraphNode];
    edges : [GraphEdge];
  };

  public func migration(_ : {}) : {
    accessControlState : AccessControl.AccessControlState;
    userProfiles : Map.Map<Principal, UserProfile>;
    userDocuments : Map.Map<Principal, Map.Map<Nat, Document>>;
    userVersions : Map.Map<Principal, Map.Map<Nat, [DocumentVersion]>>;
    userTags : Map.Map<Principal, Map.Map<Nat, Tag>>;
    var nextDocId : Nat;
    var nextTagId : Nat;
  } {
    {
      accessControlState = AccessControl.initState();
      userProfiles = Map.empty();
      userDocuments = Map.empty();
      userVersions = Map.empty();
      userTags = Map.empty();
      var nextDocId = 0;
      var nextTagId = 0;
    };
  };
};
