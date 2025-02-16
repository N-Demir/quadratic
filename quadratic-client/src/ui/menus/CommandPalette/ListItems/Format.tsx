import { AttachMoney, FormatClear, Functions, ModeEditOutline, Percent } from '@mui/icons-material';
import { hasPermissionToEditFile } from '../../../../actions';
import { KeyboardSymbols } from '../../../../helpers/keyboardSymbols';
import { DecimalDecrease, DecimalIncrease, Icon123 } from '../../../icons';
import {
  clearFormattingAndBorders,
  removeCellNumericFormat,
  textFormatDecreaseDecimalPlaces,
  textFormatIncreaseDecimalPlaces,
  textFormatSetCurrency,
  textFormatSetExponential,
  textFormatSetPercentage,
  toggleCommas,
} from '../../TopBar/SubMenus/formatCells';
import { CommandPaletteListItem } from '../CommandPaletteListItem';

const ListItems = [
  {
    label: 'Format: Clear all',
    isAvailable: hasPermissionToEditFile,
    Component: (props: any) => {
      return (
        <CommandPaletteListItem
          {...props}
          icon={<FormatClear />}
          action={clearFormattingAndBorders}
          shortcut="\"
          shortcutModifiers={KeyboardSymbols.Command}
        />
      );
    },
  },
  {
    label: 'Format: Number as automatic',
    isAvailable: hasPermissionToEditFile,
    Component: (props: any) => {
      return <CommandPaletteListItem {...props} icon={<Icon123 />} action={removeCellNumericFormat} />;
    },
  },
  {
    label: 'Format: Number as currency',
    isAvailable: hasPermissionToEditFile,
    Component: (props: any) => {
      return <CommandPaletteListItem {...props} icon={<AttachMoney />} action={textFormatSetCurrency} />;
    },
  },
  {
    label: 'Format: Number as percentage',
    isAvailable: hasPermissionToEditFile,
    Component: (props: any) => {
      return <CommandPaletteListItem {...props} icon={<Percent />} action={textFormatSetPercentage} />;
    },
  },
  {
    label: 'Format: Number as scientific',
    isAvailable: hasPermissionToEditFile,
    Component: (props: any) => {
      return <CommandPaletteListItem {...props} icon={<Functions />} action={textFormatSetExponential} />;
    },
  },
  {
    label: 'Format: Number toggle commas',
    isAvailable: hasPermissionToEditFile,
    Component: (props: any) => {
      return <CommandPaletteListItem {...props} icon={<ModeEditOutline />} action={toggleCommas} />;
    },
  },
  {
    label: 'Format: Increase decimal place',
    isAvailable: hasPermissionToEditFile,
    Component: (props: any) => {
      return <CommandPaletteListItem {...props} icon={<DecimalIncrease />} action={textFormatIncreaseDecimalPlaces} />;
    },
  },
  {
    label: 'Format: Decrease decimal place',
    isAvailable: hasPermissionToEditFile,
    Component: (props: any) => {
      return <CommandPaletteListItem {...props} icon={<DecimalDecrease />} action={textFormatDecreaseDecimalPlaces} />;
    },
  },
];

export default ListItems;
