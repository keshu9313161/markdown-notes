import Char "mo:core/Char";
import Int "mo:core/Int";
import List "mo:core/List";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Time "mo:core/Time";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";

actor {
  let accessControlState : AccessControl.AccessControlState;
  include MixinAuthorization(accessControlState, null);
  func requireAuth(caller : Principal) {
    if (caller.isAnonymous()) {
      Runtime.trap("Not authenticated");
    };
  };

  // Types

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

  // Limits

  transient let MAX_DOCS_PER_USER = 500;
  transient let MAX_TAGS_PER_USER = 50;
  transient let MAX_TAGS_PER_DOC = 20;
  transient let MAX_CONTENT_LENGTH = 100_000;

  // State

  let userProfiles : Map.Map<Principal, UserProfile>;
  let userDocuments : Map.Map<Principal, Map.Map<Nat, Document>>;
  let userVersions : Map.Map<Principal, Map.Map<Nat, [DocumentVersion]>>;
  let userTags : Map.Map<Principal, Map.Map<Nat, Tag>>;
  var nextDocId : Nat;
  var nextTagId : Nat;

  func getMap<V>(store : Map.Map<Principal, Map.Map<Nat, V>>, user : Principal) : Map.Map<Nat, V> {
    switch (store.get(user)) {
      case (?m) { m };
      case (null) {
        let m = Map.empty<Nat, V>();
        store.add(user, m);
        m;
      };
    };
  };

  func getUserDocs(u : Principal) : Map.Map<Nat, Document> {
    getMap(userDocuments, u);
  };
  func getUserVersions(u : Principal) : Map.Map<Nat, [DocumentVersion]> {
    getMap(userVersions, u);
  };
  func getUserTags(u : Principal) : Map.Map<Nat, Tag> { getMap(userTags, u) };

  func toLower(t : Text) : Text {
    t.map(
      func(c) {
        if (c >= 'A' and c <= 'Z') {
          Char.fromNat32(c.toNat32() + 32);
        } else {
          c;
        };
      }
    );
  };

  // Extract [[link targets]] from content
  func parseWikiLinks(content : Text) : [Text] {
    let parts = content.split(#text "[[");
    let results = List.empty<Text>();
    ignore parts.next(); // skip text before first [[
    for (part in parts) {
      let inner = part.split(#text "]]");
      switch (inner.next()) {
        case (?title) {
          // Only accept if ]] was actually found (split produced a second part)
          switch (inner.next()) {
            case (?_) {
              if (title != "" and title.size() <= 200) {
                results.add(title);
              };
            };
            case (null) {};
          };
        };
        case (null) {};
      };
    };
    results.toArray();
  };

  // Profile endpoints

  public query ({ caller }) func getProfile() : async ?UserProfile {
    requireAuth(caller);
    userProfiles.get(caller);
  };

  public shared ({ caller }) func setProfile(name : Text) : async () {
    requireAuth(caller);
    if (name == "") {
      Runtime.trap("Name cannot be empty");
    };
    if (name.size() > 100) {
      Runtime.trap("Name must be 100 characters or fewer");
    };
    userProfiles.add(caller, { name });
  };

  // Document endpoints

  public shared ({ caller }) func createDocument(title : Text) : async Document {
    requireAuth(caller);
    if (title == "") {
      Runtime.trap("Title cannot be empty");
    };
    if (title.size() > 200) {
      Runtime.trap("Title must be 200 characters or fewer");
    };
    if (getUserDocs(caller).size() >= MAX_DOCS_PER_USER) {
      Runtime.trap("Document limit reached (500)");
    };
    let id = nextDocId;
    nextDocId += 1;
    let now = Time.now();
    let doc : Document = {
      id;
      title;
      content = "";
      tagIds = [];
      createdAt = now;
      updatedAt = now;
    };
    getUserDocs(caller).add(id, doc);
    doc;
  };

  public query ({ caller }) func getDocument(id : DocumentId) : async ?Document {
    requireAuth(caller);
    getUserDocs(caller).get(id);
  };

  func sortDocs(docs : [Document], sortBy : Text) : [Document] {
    docs.sort(
      func(a, b) {
        switch (sortBy) {
          case ("oldest") { Int.compare(a.createdAt, b.createdAt) };
          case ("title-asc") {
            Text.compare(toLower(a.title), toLower(b.title));
          };
          case ("title-desc") {
            Text.compare(toLower(b.title), toLower(a.title));
          };
          case (_) { Int.compare(b.updatedAt, a.updatedAt) };
        };
      }
    );
  };

  public query ({ caller }) func getDocuments(searchQuery : Text, filterTagIds : [TagId], sortBy : Text) : async [Document] {
    requireAuth(caller);
    let queryLower = toLower(searchQuery);
    let results = List.empty<Document>();
    for ((_, doc) in getUserDocs(caller).entries()) {
      let matchesQuery = searchQuery == "" or toLower(doc.title).contains(#text queryLower) or toLower(doc.content).contains(#text queryLower);
      if (matchesQuery and docMatchesTags(doc, filterTagIds)) {
        results.add(doc);
      };
    };
    sortDocs(results.toArray(), sortBy);
  };

  public shared ({ caller }) func updateDocument(id : DocumentId, title : Text, content : Text, tagIds : [TagId]) : async Document {
    requireAuth(caller);
    if (title == "") {
      Runtime.trap("Title cannot be empty");
    };
    if (title.size() > 200) {
      Runtime.trap("Title must be 200 characters or fewer");
    };
    if (content.size() > MAX_CONTENT_LENGTH) {
      Runtime.trap("Content exceeds 100,000 character limit");
    };
    if (tagIds.size() > MAX_TAGS_PER_DOC) {
      Runtime.trap("Maximum 20 tags per document");
    };
    let userTagMap = getUserTags(caller);
    for (tagId in tagIds.values()) {
      if (userTagMap.get(tagId) == null) {
        Runtime.trap("Tag not found: " # tagId.toText());
      };
    };
    switch (getUserDocs(caller).get(id)) {
      case (null) { Runtime.trap("Document not found") };
      case (?existing) {
        let updated : Document = {
          id = existing.id;
          title;
          content;
          tagIds;
          createdAt = existing.createdAt;
          updatedAt = Time.now();
        };
        getUserDocs(caller).add(id, updated);
        updated;
      };
    };
  };

  public shared ({ caller }) func deleteDocument(id : DocumentId) : async () {
    requireAuth(caller);
    switch (getUserDocs(caller).get(id)) {
      case (null) { Runtime.trap("Document not found") };
      case (?_) {
        getUserDocs(caller).remove(id);
        getUserVersions(caller).remove(id);
      };
    };
  };

  // Version endpoints

  func addVersion(caller : Principal, id : DocumentId, doc : Document) {
    let version : DocumentVersion = {
      title = doc.title;
      content = doc.content;
      savedAt = Time.now();
    };
    let existing = switch (getUserVersions(caller).get(id)) {
      case (null) { [] : [DocumentVersion] };
      case (?vs) { vs };
    };
    let updated = existing.concat([version]);
    let trimmed = if (updated.size() > 10) {
      updated.sliceToArray((updated.size() - 10 : Nat), updated.size());
    } else {
      updated;
    };
    getUserVersions(caller).add(id, trimmed);
  };

  public shared ({ caller }) func saveVersion(id : DocumentId) : async () {
    requireAuth(caller);
    switch (getUserDocs(caller).get(id)) {
      case (null) { Runtime.trap("Document not found") };
      case (?doc) { addVersion(caller, id, doc) };
    };
  };

  public query ({ caller }) func getVersions(id : DocumentId) : async [DocumentVersion] {
    requireAuth(caller);
    switch (getUserVersions(caller).get(id)) {
      case (null) { [] };
      case (?vs) { vs };
    };
  };

  public shared ({ caller }) func restoreVersion(id : DocumentId, versionIndex : Nat) : async Document {
    requireAuth(caller);
    let versions = switch (getUserVersions(caller).get(id)) {
      case (null) { Runtime.trap("No versions found") };
      case (?vs) { vs };
    };
    if (versionIndex >= versions.size()) {
      Runtime.trap("Version index out of range");
    };
    let version = versions[versionIndex];
    switch (getUserDocs(caller).get(id)) {
      case (null) { Runtime.trap("Document not found") };
      case (?existing) {
        // Snapshot current state before overwriting
        addVersion(caller, id, existing);
        let restored : Document = {
          id = existing.id;
          title = version.title;
          content = version.content;
          tagIds = existing.tagIds;
          createdAt = existing.createdAt;
          updatedAt = Time.now();
        };
        getUserDocs(caller).add(id, restored);
        restored;
      };
    };
  };

  // Link endpoints

  type BacklinkRef = {
    id : DocumentId;
    title : Text;
  };

  func contentLinksTo(content : Text, targetLower : Text) : Bool {
    let links = parseWikiLinks(content);
    for (link in links.values()) {
      if (toLower(link) == targetLower) { return true };
    };
    false;
  };

  public query ({ caller }) func getBacklinks(id : DocumentId) : async [BacklinkRef] {
    requireAuth(caller);
    let targetDoc = switch (getUserDocs(caller).get(id)) {
      case (null) { Runtime.trap("Document not found") };
      case (?d) { d };
    };
    let targetLower = toLower(targetDoc.title);
    let results = List.empty<BacklinkRef>();
    for ((docId, doc) in getUserDocs(caller).entries()) {
      if (docId != id and contentLinksTo(doc.content, targetLower)) {
        results.add({ id = docId; title = doc.title });
      };
    };
    results.toArray();
  };

  public query ({ caller }) func getDocumentByTitle(title : Text) : async ?Document {
    requireAuth(caller);
    let titleLower = toLower(title);
    for ((_, doc) in getUserDocs(caller).entries()) {
      if (toLower(doc.title) == titleLower) {
        return ?doc;
      };
    };
    null;
  };

  // Search

  func docMatchesTags(doc : Document, filterTagIds : [TagId]) : Bool {
    if (filterTagIds.size() == 0) { return true };
    for (filterTag in filterTagIds.values()) {
      var found = false;
      for (docTag in doc.tagIds.values()) {
        if (docTag == filterTag) {
          found := true;
        };
      };
      if (not found) { return false };
    };
    true;
  };

  // Tag endpoints

  public shared ({ caller }) func createTag(name : Text, color : Text) : async Tag {
    requireAuth(caller);
    if (name == "") {
      Runtime.trap("Tag name cannot be empty");
    };
    if (name.size() > 50) {
      Runtime.trap("Tag name must be 50 characters or fewer");
    };
    if (color.size() > 20) {
      Runtime.trap("Color must be 20 characters or fewer");
    };
    if (getUserTags(caller).size() >= MAX_TAGS_PER_USER) {
      Runtime.trap("Tag limit reached (50)");
    };
    let id = nextTagId;
    nextTagId += 1;
    let tag : Tag = { id; name; color };
    getUserTags(caller).add(id, tag);
    tag;
  };

  public shared ({ caller }) func updateTag(id : TagId, name : Text, color : Text) : async Tag {
    requireAuth(caller);
    if (name == "") {
      Runtime.trap("Tag name cannot be empty");
    };
    if (name.size() > 50) {
      Runtime.trap("Tag name must be 50 characters or fewer");
    };
    if (color.size() > 20) {
      Runtime.trap("Color must be 20 characters or fewer");
    };
    switch (getUserTags(caller).get(id)) {
      case (null) { Runtime.trap("Tag not found") };
      case (?_) {
        let tag : Tag = { id; name; color };
        getUserTags(caller).add(id, tag);
        tag;
      };
    };
  };

  public shared ({ caller }) func deleteTag(id : TagId) : async () {
    requireAuth(caller);
    switch (getUserTags(caller).get(id)) {
      case (null) { Runtime.trap("Tag not found") };
      case (?_) {
        getUserTags(caller).remove(id);
        // Remove tag from all documents (collect first to avoid mutating during iteration)
        let docs = getUserDocs(caller).entries().toArray();
        for ((docId, doc) in docs.values()) {
          let filtered = doc.tagIds.filter(func(t) { t != id });
          if (filtered.size() != doc.tagIds.size()) {
            getUserDocs(caller).add(
              docId,
              {
                id = doc.id;
                title = doc.title;
                content = doc.content;
                tagIds = filtered;
                createdAt = doc.createdAt;
                updatedAt = doc.updatedAt;
              },
            );
          };
        };
      };
    };
  };

  public query ({ caller }) func getAllTags() : async [Tag] {
    requireAuth(caller);
    getUserTags(caller).values().toArray();
  };

  // Graph endpoint

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

  public query ({ caller }) func getGraphData() : async GraphData {
    requireAuth(caller);
    let docs = getUserDocs(caller);

    // Build title -> id lookup (case-insensitive)
    let titleToId = Map.empty<Text, Nat>();
    for ((id, doc) in docs.entries()) {
      titleToId.add(toLower(doc.title), id);
    };

    let nodes = List.empty<GraphNode>();
    let edges = List.empty<GraphEdge>();

    for ((id, doc) in docs.entries()) {
      nodes.add({ id; title = doc.title });
      let links = parseWikiLinks(doc.content);
      for (link in links.values()) {
        switch (titleToId.get(toLower(link))) {
          case (?targetId) {
            if (targetId != id) {
              edges.add({ source = id; target = targetId });
            };
          };
          case (null) {};
        };
      };
    };

    { nodes = nodes.toArray(); edges = edges.toArray() };
  };
};
