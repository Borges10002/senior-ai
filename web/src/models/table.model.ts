export interface ICollumns {
  name: string;
  field: string | any;
  label: string;
  align: "left" | "right" | "center";
  format?: any;
  sortable: boolean;
  type?: "Number" | "Date" | "String" | "Select";
  options?: string[];
  tooltip?: boolean;
  truncate?: number;
  required?: boolean;
  style?: string;
}
