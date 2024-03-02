'use client'
import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { SandpackCodeEditor, SandpackConsole, SandpackFile, SandpackFileExplorer, SandpackFiles, SandpackLayout, SandpackPreview, SandpackProvider, useSandpack } from '@codesandbox/sandpack-react';
import { nightOwl } from '@codesandbox/sandpack-themes';
import ThemeDropdown from '@components/ThemeDropdown';
import presets from '@constants/presets';
import PresetDropdown, { Preset } from '@components/PresetDropdown';
import { Button, Input } from '@nextui-org/react';
import { AnimatePresence, motion } from 'framer-motion';
import useWindowSize from '@hooks/useWindowSize';
import { useUser } from '@clerk/nextjs';
import AlertMessage from './AlertMessage';
import ResizablePanel from './ResizablePanel';
import useDocumentClientSize from '@hooks/useDocumentClientSize';
import Loader from './Loader';


type SandLayoutProps = {
  preset: Preset;
  onChangePreset: (preset: unknown) => void;
}


const SandLayout = ({ onChangePreset, preset }: SandLayoutProps) => {
  const [title, setTitle] = useState<string>('');
  const [newFileName, setNewFileName] = useState<string>('');
  const [showNewFileInput, setShowNewFileInput] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saved, setSaved] = useState(false);
  const [resizeValue, setResizeValue] = useState(0);

  const { sandpack } = useSandpack();
  const { files, addFile, activeFile, deleteFile, lazyAnchorRef, openFile, runSandpack, status, updateFile, updateCurrentFile, visibleFiles } = sandpack;

  const { width } = useDocumentClientSize();
  const { height } = useWindowSize();
  const minWidth = 200; // width of the fileExplorer
  const maxWidth = width - 32 - (minWidth * 2);
  const [initWidth, setInitWidth] = useState((width - minWidth - 32) / 2)

  useEffect(() => {
    setInitWidth(state => state === resizeValue ? state : resizeValue)
  }, [resizeValue, width])

  const { user, isLoaded } = useUser();


  const saveCobble = useCallback(async () => {
    if (!!title && (!!isLoaded && !!user)) {
      try {
        setSaved(true);
        let response = await fetch("/api/addCobble", {
          method: "POST",
          body: JSON.stringify({
            title,
            preset,
            files,
            activeFile,
            resizeValue,
          }),
          headers: {
            Accept: "application/json, text/plain, */*",
            "Description-Type": "application/json",
          },
        });
        let savedCobble = await response.json();
        setError('');
        setSaved(false);
        setMessage('saved! :)')
        setTimeout(() => setMessage(''), 3000);
      } catch (errorMessage: any) {
        setError(errorMessage);
        setSaved(false);
      }
    } else if (!title) {
      setError("A title is required");
      setTimeout(() => setError(''), 4000);
      return;
    } else {
      setError('Sorry, guests cannot save projects');
      setTimeout(() => setError(''), 4000);
      return;
    }
  }, [activeFile, files, preset, title, isLoaded, resizeValue, user])

  const deleteActiveFile = useCallback(() => {
    deleteFile(activeFile);
  }, [activeFile, deleteFile])

  const saveNewFile = () => {
    if (!newFileName) {
      setShowNewFileInput(false);
      return;
    }
    setShowNewFileInput(false);
    const newFilePath = `/${newFileName}`
    addFile({
      [newFilePath]: {
        code: '',
        // hidden: false,
        // active: true,
      }
    }, undefined, true);
    openFile(newFilePath);
    setNewFileName('');
  }

  const addNewFile = () => {
    setNewFileName('');
    setShowNewFileInput(true);
  }





  return (
    <>
      <div ref={lazyAnchorRef}>
        <AnimatePresence>
          {error ? <AlertMessage type="error" message={error} /> : null}
          {message ? <AlertMessage message={message} /> : null}
        </AnimatePresence>
        <div className="flex flex-wrap">
          <div className="flex w-full shrink md:pr-6 md:w-56 md:grow md:max-w-xs items-center">
            <Input
              color="primary"
              radius="full"
              size="md"
              value={title}
              placeholder="new cobble"
              onValueChange={(title: string) => setTitle(title)}
              endContent={
                <Button
                  className="px-4"
                  color="primary"
                  onClick={saveCobble}
                  radius="full"
                  variant="flat"
                  size="sm"
                  disabled={saved}
                >{!!saved ? <span><Loader />{` `}</span> : 'save cobble'}</Button>
              }
            />
          </div>
          <div className="flex flex-wrap items-center justify-between xs:justify-end ml-auto w-full pt-3 min-[822px]:pt-0 md:w-auto">
            <AnimatePresence initial={false} >
              <motion.div
                className="w-full xs:w-auto xs:mr-3 grow md:grow-0 shrink"
                animate={showNewFileInput ? 'anim' : 'init'}
                variants={{
                  init: {
                    opacity: 0,
                    visibility: 'hidden',
                    transition: {
                      opacity: {
                        duration: 0.3,
                      },
                      visibility: {
                        delay: 0.5,
                      }
                    }
                  },
                  anim: {
                    opacity: 1,
                    visibility: 'visible',
                    transition: {
                      opacity: {
                        duration: 0.3,
                      },
                    }
                  },
                }}
              >
                <Input
                  className="text-default-500"
                  color="default"
                  radius="full"
                  size="sm"
                  value={newFileName}
                  placeholder="newFileName.txt"
                  onValueChange={(newName: string) => setNewFileName(newName)}
                  variant="bordered"
                  disabled={!showNewFileInput}
                />
              </motion.div>
            </AnimatePresence>
            <Button
              className="mr-0 sm:mr-3 mt-3 xs:mt-0 px-6"
              color="default"
              onClick={showNewFileInput ? saveNewFile : addNewFile}
              radius="full"
              variant="ghost"
              size="sm"
            >{showNewFileInput ? 'save new file' : 'add new file'}</Button>
            <div className="mt-3 min-[614px]:mt-0 w-full xs:w-auto md:mt-0 flex items-center">
              <Button
                className="ml-1 xs:ml-6 mr-auto xs:mr-6 sm:ml-0 px-6 opacity-90"
                color="danger"
                onClick={() => deleteActiveFile()}
                radius="full"
                variant="ghost"
                size="sm"
              >delete active file</Button>
              <PresetDropdown
                onSelect={onChangePreset}
                selected={preset}
              />
            </div>
            {/* <ThemeDropdown onSelect={handleThemeChange} theme={theme} /> */}
          </div>
        </div>
      </div>
      <div className="grow pt-3 flex flex-col relative">
        <SandpackLayout
          style={{
            borderRadius: '14px',
            borderWidth: 0,
          }}
        >
          {// height will always be undefined in SSR preventing hydration issues
            !!height && width >= (minWidth * 2) + 32 ?
              <SandpackFileExplorer
                style={{
                  height: !!height ? width > 768 ? width > 822 ? (height - 148) : (height - 194) : (height - 194) / 2 : '100%',
                  flexGrow: 0,
                  width: minWidth,
                }}
              /> :
              ''}
          {// height will always be undefined in SSR preventing hydration issues
            !!height && width > 768 ?
              <ResizablePanel
                initWidth={width > 768 ? initWidth : width - 34 - minWidth}
                minWidth={width > 768 ? minWidth : width - 32 - minWidth}
                maxWidth={width > 768 ? maxWidth : width - 32 - minWidth}
                setResizeValue={setResizeValue}
              >
                <SandpackCodeEditor
                  style={{
                    height: !!height ? width > 822 ? (height - 148) : (height - 194) : '10px',
                    minHeight: 0,
                  }}
                  showTabs={true}
                  // closableTabs={true}
                  showInlineErrors={true}
                  showLineNumbers={true}
                  wrapContent={true}

                />
              </ResizablePanel> :
              <SandpackCodeEditor
                style={{
                  height: !!height ? (height - 194) / 2 : '10px',
                  minHeight: 0,
                  flexGrow: 1,
                  flexShrink: 1,
                  width: 'auto',
                  minWidth: minWidth,
                }}
                showTabs={true}
                // closableTabs={true}
                showInlineErrors={true}
                showLineNumbers={true}
                wrapContent={true}

              />
          }
          {/* <SandpackConsole /> */}
          <SandpackPreview
            style={{
              height: !!height ? width > 768 ? width > 822 ? (height - 148) : (height - 194) : (height - 194) / 2 : '100%',
            }}
            showOpenInCodeSandbox={false}
          // showRefreshButton={true}
          // showRestartButton={true}
          />
        </SandpackLayout>
        <AnimatePresence initial={false}>
          {(!status || status === 'initial') &&
            <motion.div
              className="h-full w-full absolute top-0 left-0 bg-black rounded-2xl"
              initial="init"
              animate="anim"
              exit="init"
              variants={{
                init: {
                  opacity: 0,
                },
                anim: {
                  opacity: 1,
                },
              }}
            >

            </motion.div>
          }
        </AnimatePresence>
      </div>

    </>
  )



}



export default function SandEditor() {
  const [preset, setPreset] = useState<Preset>('react');

  const onChangePreset = (newValue: unknown) => {
    setPreset(newValue as Preset)
  }


  return (
    <SandpackProvider
      style={{
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
      }}
      // customSetup={{
      //   dependencies: presets[preset].dependencies,
      // }}
      files={presets[preset].files as SandpackFiles}
      theme={nightOwl}
      template={presets[preset].template}
      options={{
        externalResources: presets[preset].externalResources,
        //   // visibleFiles: ["/App.js", "/Button.js"],
        //   // activeFile: presets[preset].activeFile,

      }}
    // autoSave='true'
    >
      <SandLayout
        onChangePreset={onChangePreset}
        preset={preset}
      />
    </SandpackProvider>
  )
}
