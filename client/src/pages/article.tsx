import React, { useState, useEffect } from "react";
import { ArrowLeft, Share2, Clock, TrendingUp, Eye, Settings, ChevronDown, Search } from "lucide-react";

// Mock data for demonstration
const mockArticleData = {
  article: {
    title: "One Big Beautiful Bill: Trump's Comprehensive Legislative Package",
    heroImageUrl: "https://images.unsplash.com/photo-1555708982-8645ec9ce3cc?w=800&h=400&fit=crop",
    excerpt: "Analysis of the comprehensive legislation package proposed by the Trump administration"
  },
  executiveSummary: {
    points: [
      "Makes Trump tax cuts permanent",
      "Tax reductions for incomes <$500k (5-year limit)",
      "New deductions: tips, overtime, auto loans (expire 2028)",
      "Adds $200 to child tax credit",
      "1% remittance tax; increases endowment investment taxes"
    ]
  },
  timelineItems: [
    {
      date: "2025-01-20",
      title: "Bill Introduction",
      description: "H.R.1 introduced in Congress"
    },
    {
      date: "2025-01-25",
      title: "Committee Review",
      description: "House Ways and Means Committee begins review"
    }
  ],
  relatedArticles: [
    {
      title: "Congressional Budget Office Analysis",
      url: "#",
      excerpt: "CBO projects $2.8T deficit increase"
    },
    {
      title: "State Reactions to Federal Changes",
      url: "#",
      excerpt: "Governors respond to Medicaid modifications"
    }
  ],
  rawFacts: [
    {
      fact: "Makes Trump tax cuts permanent",
      source: "H.R.1 Bill Text"
    },
    {
      fact: "Adds $2.8T to deficit by 2034",
      source: "CBO Analysis"
    }
  ],
  perspectives: []
};

const timioLogo = "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=64&h=64&fit=crop&crop=center";
const execSummaryIcon = "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=24&h=24&fit=crop";
const conflictIcon = "https://images.unsplash.com/photo-1584467735871-8297329f9bb3?w=24&h=24&fit=crop";
const pivotIcon = "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=24&h=24&fit=crop";

// Simple Card components
const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-lg shadow-md ${className}`}>
    {children}
  </div>
);

const CardContent = ({ children, className = "" }) => (
  <div className={`${className}`}>
    {children}
  </div>
);

// Simple Button component
const Button = ({ children, onClick, variant = "default", size = "default", className = "", disabled = false, type = "button" }) => {
  const baseClasses = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    ghost: "bg-transparent hover:bg-gray-100 text-gray-700",
    outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
  };

  const sizes = {
    default: "px-4 py-2 text-sm",
    sm: "px-3 py-1.5 text-sm"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
};

// Simple Skeleton component
const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse bg-gray-300 rounded ${className}`}></div>
);

// Expandable Section component
const ExpandableSection = ({ title, icon, customIcon, defaultOpen = false, content }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full p-6 text-left hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {customIcon && (
                <img src={customIcon} alt={title} className="w-6 h-6" />
              )}
              <h3 className="text-xl font-bold text-gray-900">{title}</h3>
            </div>
            <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>
        {isOpen && (
          <div className="px-6 pb-6">
            {content}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Collapsible component
const Collapsible = ({ children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div>
      {React.Children.map(children, (child, index) => {
        if (index === 0) {
          // First child is the trigger
          return React.cloneElement(child, { onClick: () => setIsOpen(!isOpen) });
        }
        if (index === 1 && isOpen) {
          // Second child is the content
          return child;
        }
        return null;
      })}
    </div>
  );
};

const CollapsibleTrigger = ({ children, onClick }) => (
  <div onClick={onClick} className="cursor-pointer">
    {children}
  </div>
);

const CollapsibleContent = ({ children }) => (
  <div>{children}</div>
);

// Timeline component
const Timeline = ({ items }) => (
  <Card>
    <CardContent className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <Clock className="h-5 w-5 mr-2" />
        Timeline
      </h3>
      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={index} className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
            <div>
              <div className="text-sm text-gray-500">{item.date}</div>
              <div className="font-medium">{item.title}</div>
              <div className="text-sm text-gray-600">{item.description}</div>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

// Related Articles component
const RelatedArticles = ({ articles }) => (
  <Card>
    <CardContent className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <TrendingUp className="h-5 w-5 mr-2" />
        Related Articles
      </h3>
      <div className="space-y-4">
        {articles.map((article, index) => (
          <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
            <h4 className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer">
              {article.title}
            </h4>
            <p className="text-sm text-gray-600 mt-1">{article.excerpt}</p>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export default function ArticlePage() {
  const [showThemeController, setShowThemeController] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResearching, setIsResearching] = useState(false);
  const [articleData, setArticleData] = useState(mockArticleData);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: articleData?.article.title,
          text: articleData?.article.excerpt,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard!");
      }
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  const handleBackToFeed = () => {
    // In a real app, you'd use router navigation
    console.log("Navigate back to feed");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsResearching(true);
      // Simulate research
      setTimeout(() => {
        setIsResearching(false);
        console.log("Research completed for:", searchQuery);
      }, 2000);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch(e);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-32">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-6">
                  <Skeleton className="h-16 w-16 rounded-lg" />
                  <div>
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-32 mt-2" />
                  </div>
                </div>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-8 w-24" />
              </div>
              <Skeleton className="h-10 w-20" />
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8">
              <Skeleton className="h-96 w-full rounded-xl" />
            </div>
            <div className="lg:col-span-4">
              <Skeleton className="h-96 w-full rounded-xl" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!articleData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Article Not Found</h1>
              <p className="text-gray-600 mb-4">The article you're looking for doesn't exist.</p>
              <Button onClick={handleBackToFeed} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { article, executiveSummary, timelineItems, relatedArticles, rawFacts, perspectives } = articleData;

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-8">
            {/* Combined Header and Article Hero */}
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {/* Hero Image with Overlay */}
                <div className="relative overflow-hidden">
                  <img 
                    src={article.heroImageUrl}
                    alt={article.title}
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-40"></div>

                  {/* TIMIO Logo and Search Bar */}
                  <div className="absolute top-4 left-4 right-4 pb-2">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <img 
                          src={timioLogo} 
                          alt="TIMIO News" 
                          className="h-6 w-6 rounded-lg"
                        />
                        <span className="text-lg font-bold text-white">TIMIO News</span>
                      </div>
                      <Button
                        onClick={handleBackToFeed}
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-white/20 px-3 py-1"
                      >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Back
                      </Button>
                    </div>

handleSearch} className="relative">
                        <div className="relative flex items-center bg-white/20 backdrop-blur-sm rounded-lg border border-white/30 shadow-lg hover:bg-white/30 transition-all duration-300 focus-within:bg-white/30 focus-within:border-white/50">
                          <Search className="h-4 w-4 text-white ml-3" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Generate a report on any event"
                            className="w-full py-2 px-3 text-white placeholder-white/70 bg-transparent border-none outline-none text-sm font-medium"
                          />
                          <Button
                            type="submit"
                            disabled={isResearching}
                            className="bg-blue-600/80 hover:bg-blue-700 text-white px-4 py-1 rounded-md text-sm font-semibold transition-all duration-200 hover:shadow-lg disabled:opacity-50"
                          >
                            {isResearching ? "Researching..." : "Research"}
                          </Button>
                        </div>
                      </form>
                    </div>
                  </div>

                  {/* Headline overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 pt-20">
                    <p className="text-xl font-bold text-blue-300 mb-3 tracking-wide">RESEARCH REPORT</p>
                    <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                      {article.title}
                    </h1>
                  </div>
                </div>

                {/* Executive Summary */}
                <ExpandableSection
                  title="Executive Summary"
                  icon="users"
                  customIcon={execSummaryIcon}
                  defaultOpen={true}
                  content={
                    <div className="space-y-3">
                      {executiveSummary.points ? 
                        executiveSummary.points.map((point, index) => (
                          <div key={index} className="flex items-start">
                            <div className="h-2 w-2 bg-black rounded-full mt-2 mr-3 flex-shrink-0" />
                            <span className="text-black">{point}</span>
                          </div>
                        ))
                        : 
                        (executiveSummary.summary ? executiveSummary.summary.split('\n').filter(line => line.trim()).map((point, index) => (
                          <div key={index} className="flex items-start">
                            <div className="h-2 w-2 bg-black rounded-full mt-2 mr-3 flex-shrink-0" />
                            <span className="text-black">{point.replace(/^-\s*/, '')}</span>
                          </div>
                        )) : [])
                      }
                    </div>
                  }
                />
              </CardContent>
            </Card>

            {/* Expandable Sections */}
            <div className="space-y-6 mt-8">
              <ExpandableSection
                title="Raw Facts"
                icon="database"
                content={
                  <div className="mt-4 space-y-8">
                    {rawFacts && rawFacts.length > 0 ? (
                      <div className="space-y-6">
                        {rawFacts.map((fact, index) => (
                          <div key={index} className="flex items-start">
                            <div className="h-1.5 w-1.5 bg-black rounded-full mt-2 mr-3 flex-shrink-0" />
                            <div className="flex-1">
                              <span className="text-gray-900 leading-relaxed">
                                {fact.fact}
                              </span>
                              {fact.source && (
                                <div className="text-sm text-gray-600 mt-1">
                                  Source: {fact.source}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div>
                        <h3 className="text-lg font-bold text-black mb-3">
                          <a 
                            href="https://www.congress.gov/search?q=%7B%22source%22:%22legislation%22%7D" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:text-gray-600 transition-colors"
                          >
                            Directly from the Bill: H.R.1 - "One Big Beautiful Bill Act"<br />
                            (Congress.gov)
                          </a>
                        </h3>
                        <div className="w-full h-0.5 bg-black mb-6"></div>
                        <div className="space-y-3">
                          <div className="flex items-start">
                            <div className="h-1.5 w-1.5 bg-black rounded-full mt-2 mr-3 flex-shrink-0" />
                            <span className="text-gray-900 leading-relaxed">
                              Makes Trump tax cuts permanent
                            </span>
                          </div>
                          <div className="flex items-start">
                            <div className="h-1.5 w-1.5 bg-black rounded-full mt-2 mr-3 flex-shrink-0" />
                            <span className="text-gray-900 leading-relaxed">
                              Tax reductions for incomes &lt;$500k (5-year limit)
                            </span>
                          </div>
                          <div className="flex items-start">
                            <div className="h-1.5 w-1.5 bg-black rounded-full mt-2 mr-3 flex-shrink-0" />
                            <span className="text-gray-900 leading-relaxed">
                              New deductions: tips, overtime, auto loans (expire 2028)
                            </span>
                          </div>
                          <div className="flex items-start">
                            <div className="h-1.5 w-1.5 bg-black rounded-full mt-2 mr-3 flex-shrink-0" />
                            <span className="text-gray-900 leading-relaxed">
                              Adds $200 to child tax credit
                            </span>
                          </div>
                          <div className="flex items-start">
                            <div className="h-1.5 w-1.5 bg-black rounded-full mt-2 mr-3 flex-shrink-0" />
                            <span className="text-gray-900 leading-relaxed">
                              1% remittance tax; increases endowment investment taxes
                            </span>
                          </div>
                          <div className="flex items-start">
                            <div className="h-1.5 w-1.5 bg-black rounded-full mt-2 mr-3 flex-shrink-0" />
                            <span className="text-gray-900 leading-relaxed">
                              Ends clean energy credits; opens federal land to oil & gas
                            </span>
                          </div>
                          <div className="flex items-start">
                            <div className="h-1.5 w-1.5 bg-black rounded-full mt-2 mr-3 flex-shrink-0" />
                            <span className="text-gray-900 leading-relaxed">
                              Cuts to Medicaid, Medicare, SNAP; shifts SNAP costs to states
                            </span>
                          </div>
                          <div className="flex items-start">
                            <div className="h-1.5 w-1.5 bg-black rounded-full mt-2 mr-3 flex-shrink-0" />
                            <span className="text-gray-900 leading-relaxed">
                              ICE funding increases tenfold to $100B by 2029
                            </span>
                          </div>
                          <div className="flex items-start">
                            <div className="h-1.5 w-1.5 bg-black rounded-full mt-2 mr-3 flex-shrink-0" />
                            <span className="text-gray-900 leading-relaxed">
                              Adds $150B to defense, $150B to border enforcement
                            </span>
                          </div>
                          <div className="flex items-start">
                            <div className="h-1.5 w-1.5 bg-black rounded-full mt-2 mr-3 flex-shrink-0" />
                            <span className="text-gray-900 leading-relaxed">
                              Raises debt ceiling by $5T
                            </span>
                          </div>
                        </div>

                        {/* CBO Analysis Section */}
                        <div className="mt-8">
                          <h3 className="text-lg font-bold text-black mb-3">
                            <a href="https://www.cbo.gov/system/files/2025-01/59927-Reconciliation.pdf" target="_blank" rel="noopener noreferrer" className="hover:text-gray-600 transition-colors">
                              Congressional Budget Office Analysis<br />
                              (CBO.gov)
                            </a>
                          </h3>
                          <div className="w-full h-0.5 bg-black mb-6"></div>
                          <div className="space-y-3">
                            <div className="flex items-start">
                              <div className="h-1.5 w-1.5 bg-black rounded-full mt-2 mr-3 flex-shrink-0" />
                              <span className="text-gray-900 leading-relaxed">
                                Adds $2.8T to deficit by 2034
                              </span>
                            </div>
                            <div className="flex items-start">
                              <div className="h-1.5 w-1.5 bg-black rounded-full mt-2 mr-3 flex-shrink-0" />
                              <span className="text-gray-900 leading-relaxed">
                                10.9M lose insurance, mainly from Medicaid
                              </span>
                            </div>
                            <div className="flex items-start">
                              <div className="h-1.5 w-1.5 bg-black rounded-full mt-2 mr-3 flex-shrink-0" />
                              <span className="text-gray-900 leading-relaxed">
                                Medicaid & CHIP enrollment drops by 10.5M
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                }
              />

              <ExpandableSection
                title="Different Perspectives"
                icon="pivot"
                customIcon={pivotIcon}
                content={
                  <div className="mt-4 space-y-4">
                    {/* Pro-Trump Perspective */}
                    <Collapsible defaultOpen={false}>
                      <CollapsibleTrigger>
                        <div className="bg-red-600 text-white p-6 rounded-lg hover:bg-red-700 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="text-left">
                              <h3 className="font-bold text-xl mb-2">A Golden Age for America: Trump Delivers on Promises</h3>
                              <p className="text-sm opacity-80">Sources: 3</p>
                            </div>
                            <ChevronDown className="h-6 w-6 ml-4 flex-shrink-0" />
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="p-6 space-y-6 bg-gray-100">
                          <p className="text-gray-800 text-lg font-semibold">Bill is historic, pro-growth, fulfills campaign promises, benefits families and businesses.</p>
                          <div className="w-full h-0.5 bg-black my-2"></div>
                          <div className="text-sm text-gray-600">
                            Pro-administration perspective content would go here...
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Democratic Opposition */}
                    <Collapsible defaultOpen={false}>
                      <CollapsibleTrigger>
                        <div className="bg-blue-600 text-white p-6 rounded-lg hover:bg-blue-700 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="text-left">
                              <h3 className="font-bold text-xl mb-2">A Gift to the Wealthy, a Blow to the Vulnerable</h3>
                              <p className="text-sm opacity-80">Sources: 3</p>
                            </div>
                            <ChevronDown className="h-6 w-6 ml-4 flex-shrink-0" />
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="p-6 space-y-6 bg-gray-100">
                          <p className="text-gray-800 text-lg font-semibold">Bill slashes social safety net, benefits rich, harms poor/elderly, increases deficit.</p>
                          <div className="w-full h-0.5 bg-black my-2"></div>
                          <div className="text-sm text-gray-600">
                            Opposition perspective content would go here...
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                }
              />

              <ExpandableSection
                title="Conflicting Info"
                icon="conflict"
                customIcon={conflictIcon}
                content={
                  <div className="mt-6 space-y-6">
                    <div className="pl-4 pb-4 border-b-2 border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-3 text-lg">Does the bill cut Medicaid?</h4>
                      <div className="ml-4">
                        <p className="text-gray-700 text-base mb-3">
                          <strong>White House:</strong> "There will be no cuts to Medicaid…protects and strengthens Medicaid for those who rely on it."
                        </p>
                        <p className="text-gray-700 text-base mb-3">
                          <strong>CBO, Governor Moore, hospital groups:</strong> Bill will cut Medicaid, millions will lose coverage
                        </p>
                      </div>
                    </div>
                    <div className="pl-4 pb-4 border-b-2 border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-3 text-lg">Effect on Deficit</h4>
                      <div className="ml-4">
                        <p className="text-gray-700 text-base mb-3">
                          <strong>White House:</strong> "Reduces deficits by over $2 trillion by increasing economic growth and cutting waste, fraud, and abuse."
                        </p>
                        <p className="text-gray-700 text-base mb-3">
                          <strong>CBO:</strong> "Adds $3.4 trillion to federal deficits over the next 10 years."
                        </p>
                      </div>
                    </div>
                  </div>
                }
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            <Timeline items={timelineItems} />
            <div className="border-t-2 border-gray-300 my-6"></div>
            <RelatedArticles articles={relatedArticles} />
          </div>
        </div>
      </main>
    </div>
  );
}import React, { useState, useEffect } from "react";
import { ArrowLeft, Share2, Clock, TrendingUp, Eye, Settings, ChevronDown, Search } from "lucide-react";

// Mock data for demonstration
const mockArticleData = {
  article: {
    title: "One Big Beautiful Bill: Trump's Comprehensive Legislative Package",
    heroImageUrl: "https://images.unsplash.com/photo-1555708982-8645ec9ce3cc?w=800&h=400&fit=crop",
    excerpt: "Analysis of the comprehensive legislation package proposed by the Trump administration"
  },
  executiveSummary: {
    points: [
      "Makes Trump tax cuts permanent",
      "Tax reductions for incomes <$500k (5-year limit)",
      "New deductions: tips, overtime, auto loans (expire 2028)",
      "Adds $200 to child tax credit",
      "1% remittance tax; increases endowment investment taxes"
    ]
  },
  timelineItems: [
    {
      date: "2025-01-20",
      title: "Bill Introduction",
      description: "H.R.1 introduced in Congress"
    },
    {
      date: "2025-01-25",
      title: "Committee Review",
      description: "House Ways and Means Committee begins review"
    }
  ],
  relatedArticles: [
    {
      title: "Congressional Budget Office Analysis",
      url: "#",
      excerpt: "CBO projects $2.8T deficit increase"
    },
    {
      title: "State Reactions to Federal Changes",
      url: "#",
      excerpt: "Governors respond to Medicaid modifications"
    }
  ],
  rawFacts: [
    {
      fact: "Makes Trump tax cuts permanent",
      source: "H.R.1 Bill Text"
    },
    {
      fact: "Adds $2.8T to deficit by 2034",
      source: "CBO Analysis"
    }
  ],
  perspectives: []
};

const timioLogo = "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=64&h=64&fit=crop&crop=center";
const execSummaryIcon = "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=24&h=24&fit=crop";
const conflictIcon = "https://images.unsplash.com/photo-1584467735871-8297329f9bb3?w=24&h=24&fit=crop";
const pivotIcon = "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=24&h=24&fit=crop";

// Simple Card components
const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-lg shadow-md ${className}`}>
    {children}
  </div>
);

const CardContent = ({ children, className = "" }) => (
  <div className={`${className}`}>
    {children}
  </div>
);

// Simple Button component
const Button = ({ children, onClick, variant = "default", size = "default", className = "", disabled = false, type = "button" }) => {
  const baseClasses = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    ghost: "bg-transparent hover:bg-gray-100 text-gray-700",
    outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
  };

  const sizes = {
    default: "px-4 py-2 text-sm",
    sm: "px-3 py-1.5 text-sm"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
};

// Simple Skeleton component
const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse bg-gray-300 rounded ${className}`}></div>
);

// Expandable Section component
const ExpandableSection = ({ title, icon, customIcon, defaultOpen = false, content }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full p-6 text-left hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {customIcon && (
                <img src={customIcon} alt={title} className="w-6 h-6" />
              )}
              <h3 className="text-xl font-bold text-gray-900">{title}</h3>
            </div>
            <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>
        {isOpen && (
          <div className="px-6 pb-6">
            {content}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Collapsible component
const Collapsible = ({ children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div>
      {React.Children.map(children, (child, index) => {
        if (index === 0) {
          // First child is the trigger
          return React.cloneElement(child, { onClick: () => setIsOpen(!isOpen) });
        }
        if (index === 1 && isOpen) {
          // Second child is the content
          return child;
        }
        return null;
      })}
    </div>
  );
};

const CollapsibleTrigger = ({ children, onClick }) => (
  <div onClick={onClick} className="cursor-pointer">
    {children}
  </div>
);

const CollapsibleContent = ({ children }) => (
  <div>{children}</div>
);

// Timeline component
const Timeline = ({ items }) => (
  <Card>
    <CardContent className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <Clock className="h-5 w-5 mr-2" />
        Timeline
      </h3>
      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={index} className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
            <div>
              <div className="text-sm text-gray-500">{item.date}</div>
              <div className="font-medium">{item.title}</div>
              <div className="text-sm text-gray-600">{item.description}</div>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

// Related Articles component
const RelatedArticles = ({ articles }) => (
  <Card>
    <CardContent className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <TrendingUp className="h-5 w-5 mr-2" />
        Related Articles
      </h3>
      <div className="space-y-4">
        {articles.map((article, index) => (
          <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
            <h4 className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer">
              {article.title}
            </h4>
            <p className="text-sm text-gray-600 mt-1">{article.excerpt}</p>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export default function ArticlePage() {
  const [showThemeController, setShowThemeController] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResearching, setIsResearching] = useState(false);
  const [articleData, setArticleData] = useState(mockArticleData);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: articleData?.article.title,
          text: articleData?.article.excerpt,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard!");
      }
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  const handleBackToFeed = () => {
    // In a real app, you'd use router navigation
    console.log("Navigate back to feed");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsResearching(true);
      // Simulate research
      setTimeout(() => {
        setIsResearching(false);
        console.log("Research completed for:", searchQuery);
      }, 2000);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch(e);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-32">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-6">
                  <Skeleton className="h-16 w-16 rounded-lg" />
                  <div>
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-32 mt-2" />
                  </div>
                </div>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-8 w-24" />
              </div>
              <Skeleton className="h-10 w-20" />
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8">
              <Skeleton className="h-96 w-full rounded-xl" />
            </div>
            <div className="lg:col-span-4">
              <Skeleton className="h-96 w-full rounded-xl" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!articleData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Article Not Found</h1>
              <p className="text-gray-600 mb-4">The article you're looking for doesn't exist.</p>
              <Button onClick={handleBackToFeed} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { article, executiveSummary, timelineItems, relatedArticles, rawFacts, perspectives } = articleData;

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-8">
            {/* Combined Header and Article Hero */}
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {/* Hero Image with Overlay */}
                <div className="relative overflow-hidden">
                  <img 
                    src={article.heroImageUrl}
                    alt={article.title}
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-40"></div>

                  {/* TIMIO Logo and Search Bar */}
                  <div className="absolute top-4 left-4 right-4 pb-2">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <img 
                          src={timioLogo} 
                          alt="TIMIO News" 
                          className="h-6 w-6 rounded-lg"
                        />
                        <span className="text-lg font-bold text-white">TIMIO News</span>
                      </div>
                      <Button
                        onClick={handleBackToFeed}
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-white/20 px-3 py-1"
                      >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Back
                      </Button>
                    </div>

handleSearch} className="relative">
                        <div className="relative flex items-center bg-white/20 backdrop-blur-sm rounded-lg border border-white/30 shadow-lg hover:bg-white/30 transition-all duration-300 focus-within:bg-white/30 focus-within:border-white/50">
                          <Search className="h-4 w-4 text-white ml-3" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Generate a report on any event"
                            className="w-full py-2 px-3 text-white placeholder-white/70 bg-transparent border-none outline-none text-sm font-medium"
                          />
                          <Button
                            type="submit"
                            disabled={isResearching}
                            className="bg-blue-600/80 hover:bg-blue-700 text-white px-4 py-1 rounded-md text-sm font-semibold transition-all duration-200 hover:shadow-lg disabled:opacity-50"
                          >
                            {isResearching ? "Researching..." : "Research"}
                          </Button>
                        </div>
                      </form>
                    </div>
                  </div>

                  {/* Headline overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 pt-20">
                    <p className="text-xl font-bold text-blue-300 mb-3 tracking-wide">RESEARCH REPORT</p>
                    <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                      {article.title}
                    </h1>
                  </div>
                </div>

                {/* Executive Summary */}
                <ExpandableSection
                  title="Executive Summary"
                  icon="users"
                  customIcon={execSummaryIcon}
                  defaultOpen={true}
                  content={
                    <div className="space-y-3">
                      {executiveSummary.points ? 
                        executiveSummary.points.map((point, index) => (
                          <div key={index} className="flex items-start">
                            <div className="h-2 w-2 bg-black rounded-full mt-2 mr-3 flex-shrink-0" />
                            <span className="text-black">{point}</span>
                          </div>
                        ))
                        : 
                        (executiveSummary.summary ? executiveSummary.summary.split('\n').filter(line => line.trim()).map((point, index) => (
                          <div key={index} className="flex items-start">
                            <div className="h-2 w-2 bg-black rounded-full mt-2 mr-3 flex-shrink-0" />
                            <span className="text-black">{point.replace(/^-\s*/, '')}</span>
                          </div>
                        )) : [])
                      }
                    </div>
                  }
                />
              </CardContent>
            </Card>

            {/* Expandable Sections */}
            <div className="space-y-6 mt-8">
              <ExpandableSection
                title="Raw Facts"
                icon="database"
                content={
                  <div className="mt-4 space-y-8">
                    {rawFacts && rawFacts.length > 0 ? (
                      <div className="space-y-6">
                        {rawFacts.map((fact, index) => (
                          <div key={index} className="flex items-start">
                            <div className="h-1.5 w-1.5 bg-black rounded-full mt-2 mr-3 flex-shrink-0" />
                            <div className="flex-1">
                              <span className="text-gray-900 leading-relaxed">
                                {fact.fact}
                              </span>
                              {fact.source && (
                                <div className="text-sm text-gray-600 mt-1">
                                  Source: {fact.source}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div>
                        <h3 className="text-lg font-bold text-black mb-3">
                          <a 
                            href="https://www.congress.gov/search?q=%7B%22source%22:%22legislation%22%7D" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:text-gray-600 transition-colors"
                          >
                            Directly from the Bill: H.R.1 - "One Big Beautiful Bill Act"<br />
                            (Congress.gov)
                          </a>
                        </h3>
                        <div className="w-full h-0.5 bg-black mb-6"></div>
                        <div className="space-y-3">
                          <div className="flex items-start">
                            <div className="h-1.5 w-1.5 bg-black rounded-full mt-2 mr-3 flex-shrink-0" />
                            <span className="text-gray-900 leading-relaxed">
                              Makes Trump tax cuts permanent
                            </span>
                          </div>
                          <div className="flex items-start">
                            <div className="h-1.5 w-1.5 bg-black rounded-full mt-2 mr-3 flex-shrink-0" />
                            <span className="text-gray-900 leading-relaxed">
                              Tax reductions for incomes &lt;$500k (5-year limit)
                            </span>
                          </div>
                          <div className="flex items-start">
                            <div className="h-1.5 w-1.5 bg-black rounded-full mt-2 mr-3 flex-shrink-0" />
                            <span className="text-gray-900 leading-relaxed">
                              New deductions: tips, overtime, auto loans (expire 2028)
                            </span>
                          </div>
                          <div className="flex items-start">
                            <div className="h-1.5 w-1.5 bg-black rounded-full mt-2 mr-3 flex-shrink-0" />
                            <span className="text-gray-900 leading-relaxed">
                              Adds $200 to child tax credit
                            </span>
                          </div>
                          <div className="flex items-start">
                            <div className="h-1.5 w-1.5 bg-black rounded-full mt-2 mr-3 flex-shrink-0" />
                            <span className="text-gray-900 leading-relaxed">
                              1% remittance tax; increases endowment investment taxes
                            </span>
                          </div>
                          <div className="flex items-start">
                            <div className="h-1.5 w-1.5 bg-black rounded-full mt-2 mr-3 flex-shrink-0" />
                            <span className="text-gray-900 leading-relaxed">
                              Ends clean energy credits; opens federal land to oil & gas
                            </span>
                          </div>
                          <div className="flex items-start">
                            <div className="h-1.5 w-1.5 bg-black rounded-full mt-2 mr-3 flex-shrink-0" />
                            <span className="text-gray-900 leading-relaxed">
                              Cuts to Medicaid, Medicare, SNAP; shifts SNAP costs to states
                            </span>
                          </div>
                          <div className="flex items-start">
                            <div className="h-1.5 w-1.5 bg-black rounded-full mt-2 mr-3 flex-shrink-0" />
                            <span className="text-gray-900 leading-relaxed">
                              ICE funding increases tenfold to $100B by 2029
                            </span>
                          </div>
                          <div className="flex items-start">
                            <div className="h-1.5 w-1.5 bg-black rounded-full mt-2 mr-3 flex-shrink-0" />
                            <span className="text-gray-900 leading-relaxed">
                              Adds $150B to defense, $150B to border enforcement
                            </span>
                          </div>
                          <div className="flex items-start">
                            <div className="h-1.5 w-1.5 bg-black rounded-full mt-2 mr-3 flex-shrink-0" />
                            <span className="text-gray-900 leading-relaxed">
                              Raises debt ceiling by $5T
                            </span>
                          </div>
                        </div>

                        {/* CBO Analysis Section */}
                        <div className="mt-8">
                          <h3 className="text-lg font-bold text-black mb-3">
                            <a href="https://www.cbo.gov/system/files/2025-01/59927-Reconciliation.pdf" target="_blank" rel="noopener noreferrer" className="hover:text-gray-600 transition-colors">
                              Congressional Budget Office Analysis<br />
                              (CBO.gov)
                            </a>
                          </h3>
                          <div className="w-full h-0.5 bg-black mb-6"></div>
                          <div className="space-y-3">
                            <div className="flex items-start">
                              <div className="h-1.5 w-1.5 bg-black rounded-full mt-2 mr-3 flex-shrink-0" />
                              <span className="text-gray-900 leading-relaxed">
                                Adds $2.8T to deficit by 2034
                              </span>
                            </div>
                            <div className="flex items-start">
                              <div className="h-1.5 w-1.5 bg-black rounded-full mt-2 mr-3 flex-shrink-0" />
                              <span className="text-gray-900 leading-relaxed">
                                10.9M lose insurance, mainly from Medicaid
                              </span>
                            </div>
                            <div className="flex items-start">
                              <div className="h-1.5 w-1.5 bg-black rounded-full mt-2 mr-3 flex-shrink-0" />
                              <span className="text-gray-900 leading-relaxed">
                                Medicaid & CHIP enrollment drops by 10.5M
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                }
              />

              <ExpandableSection
                title="Different Perspectives"
                icon="pivot"
                customIcon={pivotIcon}
                content={
                  <div className="mt-4 space-y-4">
                    {/* Pro-Trump Perspective */}
                    <Collapsible defaultOpen={false}>
                      <CollapsibleTrigger>
                        <div className="bg-red-600 text-white p-6 rounded-lg hover:bg-red-700 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="text-left">
                              <h3 className="font-bold text-xl mb-2">A Golden Age for America: Trump Delivers on Promises</h3>
                              <p className="text-sm opacity-80">Sources: 3</p>
                            </div>
                            <ChevronDown className="h-6 w-6 ml-4 flex-shrink-0" />
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="p-6 space-y-6 bg-gray-100">
                          <p className="text-gray-800 text-lg font-semibold">Bill is historic, pro-growth, fulfills campaign promises, benefits families and businesses.</p>
                          <div className="w-full h-0.5 bg-black my-2"></div>
                          <div className="text-sm text-gray-600">
                            Pro-administration perspective content would go here...
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Democratic Opposition */}
                    <Collapsible defaultOpen={false}>
                      <CollapsibleTrigger>
                        <div className="bg-blue-600 text-white p-6 rounded-lg hover:bg-blue-700 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="text-left">
                              <h3 className="font-bold text-xl mb-2">A Gift to the Wealthy, a Blow to the Vulnerable</h3>
                              <p className="text-sm opacity-80">Sources: 3</p>
                            </div>
                            <ChevronDown className="h-6 w-6 ml-4 flex-shrink-0" />
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="p-6 space-y-6 bg-gray-100">
                          <p className="text-gray-800 text-lg font-semibold">Bill slashes social safety net, benefits rich, harms poor/elderly, increases deficit.</p>
                          <div className="w-full h-0.5 bg-black my-2"></div>
                          <div className="text-sm text-gray-600">
                            Opposition perspective content would go here...
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                }
              />

              <ExpandableSection
                title="Conflicting Info"
                icon="conflict"
                customIcon={conflictIcon}
                content={
                  <div className="mt-6 space-y-6">
                    <div className="pl-4 pb-4 border-b-2 border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-3 text-lg">Does the bill cut Medicaid?</h4>
                      <div className="ml-4">
                        <p className="text-gray-700 text-base mb-3">
                          <strong>White House:</strong> "There will be no cuts to Medicaid…protects and strengthens Medicaid for those who rely on it."
                        </p>
                        <p className="text-gray-700 text-base mb-3">
                          <strong>CBO, Governor Moore, hospital groups:</strong> Bill will cut Medicaid, millions will lose coverage
                        </p>
                      </div>
                    </div>
                    <div className="pl-4 pb-4 border-b-2 border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-3 text-lg">Effect on Deficit</h4>
                      <div className="ml-4">
                        <p className="text-gray-700 text-base mb-3">
                          <strong>White House:</strong> "Reduces deficits by over $2 trillion by increasing economic growth and cutting waste, fraud, and abuse."
                        </p>
                        <p className="text-gray-700 text-base mb-3">
                          <strong>CBO:</strong> "Adds $3.4 trillion to federal deficits over the next 10 years."
                        </p>
                      </div>
                    </div>
                  </div>
                }
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            <Timeline items={timelineItems} />
            <div className="border-t-2 border-gray-300 my-6"></div>
            <RelatedArticles articles={relatedArticles} />
          </div>
        </div>
      </main>
    </div>
  );
}