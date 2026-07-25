export interface HomeItem {
  id: number;
  title: string;
  description: string;
}

export interface HomeApiResponse {
  items: HomeItem[];
  language: string;
}
