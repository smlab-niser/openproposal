export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8">
        <div className="text-center text-xs text-gray-600">
          © 2025{' '}
          <a 
            href="https://www.niser.ac.in/~smishra/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 hover:underline"
          >
            Subhankar Mishra's Lab
          </a>
          {' '}| DST Center for Policy Research, NISER
        </div>
      </div>
    </footer>
  )
}
