import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface SearchBarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchBar({ isOpen, onClose }: SearchBarProps) {
  const [query, setQuery] = useState('');

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-stone bg-opacity-25 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto p-4 sm:p-6 md:p-20">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="mx-auto max-w-2xl transform divide-y divide-border/60 overflow-hidden rounded-md bg-white shadow-sm ring-1 ring-black ring-opacity-5 transition-all">
              <div className="relative">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-pewter" />
                <input
                  type="text"
                  className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-charcoal placeholder:text-pewter focus:ring-0 sm:text-sm"
                  placeholder="Search courses, instructors, topics..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-4 top-3.5 text-pewter hover:text-stone"
                  onClick={onClose}
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {query && (
                <div className="max-h-80 scroll-py-2 overflow-y-auto py-2 text-sm text-charcoal">
                  <div className="px-4 py-2 text-stone">
                    Search results for &quot;{query}&quot; will appear here...
                  </div>
                </div>
              )}

              {!query && (
                <div className="py-14 px-6 text-center text-sm sm:px-14">
                  <MagnifyingGlassIcon className="mx-auto h-6 w-6 text-pewter" />
                  <p className="mt-4 font-semibold text-charcoal">Search for courses</p>
                  <p className="mt-2 text-stone">
                    Find courses, instructors, and topics quickly.
                  </p>
                </div>
              )}
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
