export interface Bill {
    participants: string[];
    title: string;
    currency: string;
    summary: Summary;
    isDraft?: boolean;
}

export interface Summary {
    [debtor: string]: {
      [creditor: string]: number;
    };
}
  