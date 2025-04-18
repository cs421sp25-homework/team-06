export interface Bill {
    id: string;
    participants: string[];
    title: string;
    currency: string;
    summary: Summary;
    isDraft?: boolean;
    archived?: boolean;
}

export interface Summary {
    [debtor: string]: {
      [creditor: string]: number;
    };
}
  