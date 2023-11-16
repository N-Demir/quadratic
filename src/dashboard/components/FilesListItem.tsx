import { Button as Btn, Button } from '@/shadcn/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shadcn/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shadcn/ui/dropdown-menu';
import { Input } from '@/shadcn/ui/input';
import { Separator } from '@/shadcn/ui/separator';
import { cn } from '@/shadcn/utils';
import { DotsVerticalIcon } from '@radix-ui/react-icons';
import React, { useEffect, useState } from 'react';
import { Link, SubmitOptions, useFetcher } from 'react-router-dom';
import { deleteFile, downloadFile, duplicateFile, renameFile as renameFileAction } from '../../actions';
import { useGlobalSnackbar } from '../../components/GlobalSnackbarProvider';
import { ROUTES } from '../../constants/routes';
import { Action, FilesListFile } from './FilesList';
import { FilesListItemCore } from './FilesListItemCore';
import { Layout, Sort, ViewPreferences } from './FilesListViewControlsDropdown';

export function FilesListItems({ children, viewPreferences }: any) {
  return (
    <ul
      className={cn(
        viewPreferences.layout === Layout.Grid && 'grid grid-cols-[repeat(auto-fill,minmax(272px,1fr))] gap-4 pb-2'
      )}
    >
      {children}
    </ul>
  );
}

export function FileListItem({
  file,
  filterValue,
  activeShareMenuFileId,
  setActiveShareMenuFileId,
  lazyLoad,
  viewPreferences,
}: {
  file: FilesListFile;
  filterValue: string;
  activeShareMenuFileId: string;
  setActiveShareMenuFileId: Function;
  lazyLoad: boolean;
  viewPreferences: ViewPreferences;
}) {
  const fetcherDelete = useFetcher();
  const fetcherDownload = useFetcher();
  const fetcherDuplicate = useFetcher();
  const fetcherRename = useFetcher();
  const { addGlobalSnackbar } = useGlobalSnackbar();
  // const [visibleDialog, setVisibleDialog] = useState<'rename' | 'delete' | ''>('');

  const { uuid, name, created_date, updated_date, public_link_access, thumbnail } = file;

  const fetcherSubmitOpts: SubmitOptions = {
    method: 'POST',
    action: ROUTES.API_FILE(uuid),
    encType: 'application/json',
  };

  const failedToDelete = fetcherDelete.data && !fetcherDelete.data.ok;
  const failedToRename = fetcherRename.data && !fetcherRename.data.ok;

  // If the download files, show an error in the UI
  // TODO async communication in UI that the file is downloading?
  useEffect(() => {
    if (fetcherDownload.data && !fetcherDownload.data.ok) {
      addGlobalSnackbar('Failed to download file. Try again.', { severity: 'error' });
    }
  }, [addGlobalSnackbar, fetcherDownload.data]);

  // Optimistically hide this file if it's being deleted
  if (fetcherDelete.state === 'submitting' || fetcherDelete.state === 'loading') {
    return null;
  }

  const renameFile = (value: string) => {
    // Update on the server and optimistically in the UI
    const data: Action['request.rename'] = { action: 'rename', name: value };
    fetcherRename.submit(data, fetcherSubmitOpts);
  };

  const handleDelete = () => {
    if (window.confirm(`Confirm you want to delete the file: “${name}”`)) {
      const data: Action['request.delete'] = {
        action: 'delete',
      };
      fetcherDelete.submit(data, fetcherSubmitOpts);
    }
  };

  const handleDownload = () => {
    const data: Action['request.download'] = {
      action: 'download',
    };
    fetcherDownload.submit(data, fetcherSubmitOpts);
  };

  const handleDuplicate = () => {
    const date = new Date().toISOString();
    const data: Action['request.duplicate'] = {
      action: 'duplicate',

      // These are the values that will optimistically render in the UI
      file: {
        uuid: 'duplicate-' + date,
        public_link_access: 'NOT_SHARED',
        name: name + ' (Copy)',
        thumbnail: null,
        updated_date: date,
        created_date: date,
      },
    };
    fetcherDuplicate.submit(data, fetcherSubmitOpts);
  };

  const handleShare = () => {
    setActiveShareMenuFileId(uuid);
  };

  const displayName = fetcherRename.json ? (fetcherRename.json as Action['request.rename']).name : name;
  const isDisabled = uuid.startsWith('duplicate-');

  const sharedProps = {
    key: uuid,
    filterValue,
    name: displayName,
    description:
      viewPreferences.sort === Sort.Created ? `Created ${timeAgo(created_date)}` : `Modified ${timeAgo(updated_date)}`,
    hasNetworkError: Boolean(failedToDelete || failedToRename),
    isShared: public_link_access !== 'NOT_SHARED',
    viewPreferences,
    actions: (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Btn variant="ghost" size="icon" className="flex-shrink-0 hover:bg-background">
            <DotsVerticalIcon className="h-4 w-4" />
          </Btn>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48">
          <DropdownMenuItem onClick={handleShare}>Share</DropdownMenuItem>
          <DropdownMenuItem onClick={handleDuplicate}>{duplicateFile.label}</DropdownMenuItem>

          <RenameItemDialog
            trigger={<DropdownMenuItem>{renameFileAction.label}</DropdownMenuItem>}
            value={displayName}
            onSave={(newValue: string) => {
              renameFile(newValue);
            }}
          />

          <DropdownMenuItem onClick={handleDownload}>{downloadFile.label}</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DeleteItemDialog
            itemName={displayName}
            onDelete={handleDelete}
            trigger={<DropdownMenuItem onSelect={(e) => e.preventDefault()}>{deleteFile.label}</DropdownMenuItem>}
          />
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  };

  return (
    <li>
      <Link
        key={uuid}
        to={ROUTES.FILE(uuid)}
        reloadDocument
        className={cn(`text-inherit no-underline`, isDisabled && `pointer-events-none opacity-50`)}
      >
        {viewPreferences.layout === Layout.Grid ? (
          <div className="border border-border p-2 lg:hover:bg-accent">
            <div className="flex aspect-video items-center justify-center bg-background">
              {thumbnail ? (
                <img
                  loading={lazyLoad ? 'lazy' : 'eager'}
                  src={thumbnail}
                  alt="File thumbnail screenshot"
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center">
                  <img
                    src={'/favicon.ico'}
                    alt="File thumbnail placeholder"
                    className={`opacity-10 brightness-0 grayscale`}
                    width="24"
                    height="24"
                  />
                </div>
              )}
            </div>
            <Separator className="border-accent" />
            <div className="pt-2">
              <FilesListItemCore {...sharedProps} />
            </div>
          </div>
        ) : (
          <div className={`flex flex-row items-center gap-4 py-2 lg:px-2 lg:hover:bg-accent`}>
            <div className={`hidden border border-border shadow-sm md:block`}>
              {thumbnail ? (
                <img
                  loading={lazyLoad ? 'lazy' : 'eager'}
                  src={thumbnail}
                  alt="File thumbnail screenshot"
                  className={`aspect-video object-fill`}
                  width="80"
                />
              ) : (
                <div className="flex aspect-video w-20 items-center justify-center bg-background">
                  <img
                    src={'/favicon.ico'}
                    alt="File thumbnail placeholder"
                    className={`h-4 w-4 opacity-10 brightness-0 grayscale`}
                    width="16"
                    height="16"
                  />
                </div>
              )}
            </div>
            <div className="flex-grow">
              <FilesListItemCore {...sharedProps} />
            </div>
          </div>
        )}
      </Link>
    </li>
  );
}

function DeleteItemDialog({ itemName, onDelete, trigger }: any) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Confirm delete</DialogTitle>
          <DialogDescription>Please confirm you want to delete “{itemName}”. This cannot be undone</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>

          <Button type="submit" variant="destructive" onClick={onDelete}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Eventually this can be moved to another file so it can be used with "Rename team"
function RenameItemDialog({
  onSave,
  value,
  trigger,
}: {
  onSave: (newValue: string) => void;
  value: string;
  trigger: any;
}) {
  const [localValue, setLocalValue] = useState<string>(value);

  const count = localValue.length;
  // TODO: one day set a max length on file/team name
  const disabled = count === 0 || localValue === value;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Don't do anything if we're disabled
    if (disabled) {
      return;
    }

    // Don't do anything if the name didn't change
    if (localValue === value) {
      // onClose();
      return;
    }

    onSave(localValue);
    // onClose();
  };

  const handleInputChange = (e: React.FormEvent<HTMLInputElement>) => {
    const newValue = e.currentTarget.value;
    setLocalValue(newValue);
  };

  const formId = 'rename-item';
  const inputId = 'rename-item-input';

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle asChild>
            <label htmlFor={inputId}>Rename file</label>
          </DialogTitle>
          <DialogDescription>{value}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} id={formId}>
          <Input id={inputId} value={localValue} autoComplete="off" onChange={handleInputChange} />
          {/* <p className={`text-right text-sm ${disabled ? 'text-destructive' : 'text-muted-foreground'}`}>
            {count} / {FILE_AND_TEAM_NAME_MAX_LENGTH}
          </p> */}
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>

          <DialogClose asChild>
            <Button disabled={disabled} type="submit" formTarget={formId}>
              Rename
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Vanilla js time formatter. Adapted from:
// https://blog.webdevsimplified.com/2020-07/relative-time-format/
const formatter = new Intl.RelativeTimeFormat(undefined, {
  numeric: 'auto',
  style: 'narrow',
});
const DIVISIONS: { amount: number; name: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, name: 'seconds' },
  { amount: 60, name: 'minutes' },
  { amount: 24, name: 'hours' },
  { amount: 7, name: 'days' },
  { amount: 4.34524, name: 'weeks' },
  { amount: 12, name: 'months' },
  { amount: Number.POSITIVE_INFINITY, name: 'years' },
];
export function timeAgo(dateString: string) {
  const date: Date = new Date(dateString);

  let duration = (date.getTime() - new Date().getTime()) / 1000;

  for (let i = 0; i < DIVISIONS.length; i++) {
    const division = DIVISIONS[i];
    if (Math.abs(duration) < division.amount) {
      return formatter.format(Math.round(duration), division.name);
    }
    duration /= division.amount;
  }
}
