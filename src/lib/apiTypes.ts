export type IdRouteContext = {
  params: Promise<{ id: string }>;
};

export type CommentRouteContext = {
  params: Promise<{ id: string; commentId: string }>;
};
