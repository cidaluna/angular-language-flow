export class SetGlobalLoading {
  static readonly type = '[Loading] Set Global Loading State';
  constructor(public readonly isLoading: boolean) {}
}
