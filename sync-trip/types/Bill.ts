export interface Bill {
    participants: string[];
    title: string;
    currency: string;
    summary: Summary;
}

export interface Summary {
    [debtor: string]: {
      [creditor: string]: number;
    };
}
  