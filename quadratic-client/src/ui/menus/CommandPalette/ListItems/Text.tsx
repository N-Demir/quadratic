import { FormatAlignCenter, FormatAlignLeft, FormatAlignRight, FormatBold, FormatItalic } from '@mui/icons-material';
import { hasPermissionToEditFile } from '../../../../actions';
import { sheets } from '../../../../grid/controller/Sheets';
import { KeyboardSymbols } from '../../../../helpers/keyboardSymbols';
import { setAlignment, setBold, setItalic } from '../../TopBar/SubMenus/formatCells';
import { CommandPaletteListItem } from '../CommandPaletteListItem';

const ListItems = [
  {
    label: 'Text: Bold',
    isAvailable: hasPermissionToEditFile,
    Component: (props: any) => {
      return (
        <CommandPaletteListItem
          {...props}
          icon={<FormatBold />}
          action={() => {
            setBold(!sheets.sheet.getFormatPrimaryCell()?.bold);
          }}
          shortcut="B"
          shortcutModifiers={KeyboardSymbols.Command}
        />
      );
    },
  },
  {
    label: 'Text: Italic',
    isAvailable: hasPermissionToEditFile,
    Component: (props: any) => {
      return (
        <CommandPaletteListItem
          {...props}
          icon={<FormatItalic />}
          action={() => {
            setItalic(!sheets.sheet.getFormatPrimaryCell()?.italic);
          }}
          shortcut="I"
          shortcutModifiers={KeyboardSymbols.Command}
        />
      );
    },
  },
  {
    label: 'Text: Align left',
    isAvailable: hasPermissionToEditFile,
    Component: (props: any) => {
      return <CommandPaletteListItem {...props} icon={<FormatAlignLeft />} action={() => setAlignment('left')} />;
    },
  },
  {
    label: 'Text: Align center',
    isAvailable: hasPermissionToEditFile,
    Component: (props: any) => {
      return <CommandPaletteListItem {...props} icon={<FormatAlignCenter />} action={() => setAlignment('center')} />;
    },
  },
  {
    label: 'Text: Align right',
    isAvailable: hasPermissionToEditFile,
    Component: (props: any) => {
      return <CommandPaletteListItem {...props} icon={<FormatAlignRight />} action={() => setAlignment('right')} />;
    },
  },
];

export default ListItems;
