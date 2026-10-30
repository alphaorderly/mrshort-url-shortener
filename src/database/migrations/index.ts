import { BaselineSchema1730246400000 } from './1730246400000-baseline-schema';
import { AddLinkMetadata1730246400001 } from './1730246400001-add-link-metadata';
import { DropLegacyColumns1730246400002 } from './1730246400002-drop-legacy-columns';

export const migrations = [
  BaselineSchema1730246400000,
  AddLinkMetadata1730246400001,
  DropLegacyColumns1730246400002,
];
