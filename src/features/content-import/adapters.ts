export type PageExtractor = {
  id: string;
  canHandle: (url: string, html: string) => boolean;
};

export const genericExtractor: PageExtractor = {
  id: 'generic',
  canHandle: () => true,
};
