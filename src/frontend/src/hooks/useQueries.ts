import { useActor, useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createActor } from "../backend";

// Profile hooks

export function useProfile() {
  const { actor, isFetching } = useActor(createActor);
  const { identity } = useInternetIdentity();

  return useQuery({
    queryKey: ["profile", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      const result = await actor.getProfile();
      return result ?? null;
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useSetProfile() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({ name }: { name: string }) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.setProfile(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["profile", identity?.getPrincipal().toString()],
      });
    },
  });
}

// Document hooks

export function useDocuments(
  query = "",
  filterTagIds: bigint[] = [],
  sortBy = "updated",
) {
  const { actor, isFetching } = useActor(createActor);
  const { identity } = useInternetIdentity();

  return useQuery({
    queryKey: [
      "documents",
      query,
      filterTagIds.map(String),
      sortBy,
      identity?.getPrincipal().toString(),
    ],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.getDocuments(query, filterTagIds, sortBy);
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useDocument(id: bigint | null) {
  const { actor } = useActor(createActor);
  const { identity } = useInternetIdentity();

  return useQuery({
    queryKey: ["document", id?.toString(), identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || id === null) throw new Error("Actor not ready");
      const result = await actor.getDocument(id);
      return result ?? null;
    },
    enabled: !!actor && !!identity && id !== null,
  });
}

export function useCreateDocument() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  const { identity: _identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({ title }: { title: string }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.createDocument(title);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["documents"],
      });
    },
  });
}

export function useUpdateDocument() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({
      id,
      title,
      content,
      tagIds,
    }: {
      id: bigint;
      title: string;
      content: string;
      tagIds: bigint[];
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.updateDocument(id, title, content, tagIds);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["documents"],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "document",
          variables.id.toString(),
          identity?.getPrincipal().toString(),
        ],
      });
    },
  });
}

// Optimistic tag toggle hook

export function useToggleDocumentTag() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({
      doc,
      tagId,
    }: {
      doc: { id: bigint; title: string; content: string; tagIds: bigint[] };
      tagId: bigint;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      const hasTag = doc.tagIds.some((t) => t === tagId);
      const newTagIds = hasTag
        ? doc.tagIds.filter((t) => t !== tagId)
        : [...doc.tagIds, tagId];
      return actor.updateDocument(doc.id, doc.title, doc.content, newTagIds);
    },
    onMutate: async ({ doc, tagId }) => {
      const principal = identity?.getPrincipal().toString();
      const docKey = ["document", doc.id.toString(), principal];
      const docsKey = ["documents"];

      await queryClient.cancelQueries({ queryKey: docKey });
      await queryClient.cancelQueries({ queryKey: docsKey });

      const prevDoc = queryClient.getQueryData(docKey);
      const prevDocs = queryClient.getQueryData(docsKey);

      const hasTag = doc.tagIds.some((t) => t === tagId);
      const newTagIds = hasTag
        ? doc.tagIds.filter((t) => t !== tagId)
        : [...doc.tagIds, tagId];

      queryClient.setQueryData(docKey, { ...doc, tagIds: newTagIds });
      queryClient.setQueryData(docsKey, (old: (typeof doc)[] | undefined) =>
        old?.map((d) => (d.id === doc.id ? { ...d, tagIds: newTagIds } : d)),
      );

      return { prevDoc, prevDocs, docKey, docsKey };
    },
    onError: (_err, _vars, context) => {
      if (context) {
        queryClient.setQueryData(context.docKey, context.prevDoc);
        queryClient.setQueryData(context.docsKey, context.prevDocs);
      }
    },
    onSettled: (_data, _err, { doc }) => {
      const principal = identity?.getPrincipal().toString();
      queryClient.invalidateQueries({
        queryKey: ["document", doc.id.toString(), principal],
      });
      queryClient.invalidateQueries({
        queryKey: ["documents"],
      });
    },
  });
}

// Combined save + version hook

export function useSaveDocument() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({
      id,
      title,
      content,
      tagIds,
    }: {
      id: bigint;
      title: string;
      content: string;
      tagIds: bigint[];
    }) => {
      if (!actor) throw new Error("Actor not ready");
      const doc = await actor.updateDocument(id, title, content, tagIds);
      await actor.saveVersion(id);
      return doc;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["documents"],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "document",
          variables.id.toString(),
          identity?.getPrincipal().toString(),
        ],
      });
    },
  });
}

// Version hooks

export function useVersions(docId: bigint | null) {
  const { actor } = useActor(createActor);
  const { identity } = useInternetIdentity();

  return useQuery({
    queryKey: [
      "versions",
      docId?.toString(),
      identity?.getPrincipal().toString(),
    ],
    queryFn: async () => {
      if (!actor || docId === null) throw new Error("Actor not ready");
      return actor.getVersions(docId);
    },
    enabled: !!actor && !!identity && docId !== null,
  });
}

export function useRestoreVersion() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({
      id,
      versionIndex,
    }: {
      id: bigint;
      versionIndex: bigint;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.restoreVersion(id, versionIndex);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["documents"],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "document",
          variables.id.toString(),
          identity?.getPrincipal().toString(),
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "versions",
          variables.id.toString(),
          identity?.getPrincipal().toString(),
        ],
      });
    },
  });
}

// Backlink hooks

export function useBacklinks(docId: bigint | null) {
  const { actor } = useActor(createActor);
  const { identity } = useInternetIdentity();

  return useQuery({
    queryKey: [
      "backlinks",
      docId?.toString(),
      identity?.getPrincipal().toString(),
    ],
    queryFn: async () => {
      if (!actor || docId === null) throw new Error("Actor not ready");
      return actor.getBacklinks(docId);
    },
    enabled: !!actor && !!identity && docId !== null,
  });
}

// Tag hooks

export function useAllTags() {
  const { actor, isFetching } = useActor(createActor);
  const { identity } = useInternetIdentity();

  return useQuery({
    queryKey: ["tags", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.getAllTags();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useCreateTag() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({ name, color }: { name: string; color: string }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.createTag(name, color);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["tags", identity?.getPrincipal().toString()],
      });
    },
  });
}

export function useUpdateTag() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({
      id,
      name,
      color,
    }: {
      id: bigint;
      name: string;
      color: string;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.updateTag(id, name, color);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["tags", identity?.getPrincipal().toString()],
      });
    },
  });
}

export function useDeleteTag() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({ id }: { id: bigint }) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.deleteTag(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["tags", identity?.getPrincipal().toString()],
      });
      queryClient.invalidateQueries({
        queryKey: ["documents"],
      });
    },
  });
}

// Graph hooks

export function useGraphData() {
  const { actor, isFetching } = useActor(createActor);
  const { identity } = useInternetIdentity();

  return useQuery({
    queryKey: ["graphData", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.getGraphData();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useDeleteDocument() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({ id }: { id: bigint }) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.deleteDocument(id);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["documents"],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "document",
          variables.id.toString(),
          identity?.getPrincipal().toString(),
        ],
      });
    },
  });
}
