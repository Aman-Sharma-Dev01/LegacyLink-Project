/**
 * AI Mentor Matching Algorithm
 * Calculates compatibility scores between students and alumni mentors
 * based on multiple weighted factors
 */

const WEIGHTS = {
  skillsMatch: 0.35,        // Matching skills (highest weight)
  industryMatch: 0.20,      // Same industry/company type
  locationMatch: 0.10,      // Same location/timezone
  graduationProximity: 0.15, // Closer graduation years = more relatable
  availabilityMatch: 0.10,  // Mentor availability
  interestMatch: 0.10,      // Shared interests
};

/**
 * Calculate similarity between two arrays using Jaccard Index
 */
const calculateJaccardSimilarity = (arr1 = [], arr2 = []) => {
  if (!arr1.length || !arr2.length) return 0;
  
  const set1 = new Set(arr1.map(s => s.toLowerCase().trim()));
  const set2 = new Set(arr2.map(s => s.toLowerCase().trim()));
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return union.size > 0 ? intersection.size / union.size : 0;
};

/**
 * Calculate fuzzy skill match (handles partial matches)
 */
const calculateFuzzySkillMatch = (studentSkills = [], alumniSkills = []) => {
  if (!studentSkills.length || !alumniSkills.length) return 0;
  
  let matchScore = 0;
  const normalizedStudentSkills = studentSkills.map(s => s.toLowerCase().trim());
  const normalizedAlumniSkills = alumniSkills.map(s => s.toLowerCase().trim());
  
  for (const studentSkill of normalizedStudentSkills) {
    for (const alumniSkill of normalizedAlumniSkills) {
      // Exact match
      if (studentSkill === alumniSkill) {
        matchScore += 1;
        break;
      }
      // Partial match (one contains the other)
      if (studentSkill.includes(alumniSkill) || alumniSkill.includes(studentSkill)) {
        matchScore += 0.7;
        break;
      }
      // Word overlap
      const studentWords = studentSkill.split(/\s+/);
      const alumniWords = alumniSkill.split(/\s+/);
      const wordOverlap = studentWords.filter(w => alumniWords.includes(w)).length;
      if (wordOverlap > 0) {
        matchScore += 0.5 * (wordOverlap / Math.max(studentWords.length, alumniWords.length));
        break;
      }
    }
  }
  
  return matchScore / studentSkills.length;
};

/**
 * Calculate graduation year proximity score
 * Alumni who graduated more recently are more relatable to current students
 */
const calculateGraduationProximity = (studentExpectedGrad, alumniGradYear) => {
  if (!studentExpectedGrad || !alumniGradYear) return 0.5; // Neutral if missing
  
  const yearDiff = Math.abs(studentExpectedGrad - alumniGradYear);
  
  // Ideal: 3-10 years difference (experienced but relatable)
  if (yearDiff >= 3 && yearDiff <= 10) return 1;
  if (yearDiff < 3) return 0.7; // Too close, may not have enough experience
  if (yearDiff <= 15) return 0.8;
  if (yearDiff <= 20) return 0.6;
  return 0.4; // More than 20 years difference
};

/**
 * Calculate location match score
 */
const calculateLocationMatch = (studentLocation, alumniLocation) => {
  if (!studentLocation || !alumniLocation) return 0.5;
  
  const loc1 = studentLocation.toLowerCase().trim();
  const loc2 = alumniLocation.toLowerCase().trim();
  
  if (loc1 === loc2) return 1;
  
  // Check for city/country overlap
  const parts1 = loc1.split(/[,\s]+/);
  const parts2 = loc2.split(/[,\s]+/);
  
  for (const p1 of parts1) {
    if (parts2.includes(p1) && p1.length > 2) return 0.7;
  }
  
  return 0.3;
};

/**
 * Calculate industry/field match
 */
const calculateIndustryMatch = (studentMajor, alumniCompany, alumniJobTitle) => {
  if (!studentMajor) return 0.5;
  
  const major = studentMajor.toLowerCase();
  const company = (alumniCompany || '').toLowerCase();
  const title = (alumniJobTitle || '').toLowerCase();
  
  // Tech-related majors and jobs
  const techKeywords = ['computer', 'software', 'engineering', 'developer', 'programmer', 'tech', 'data', 'ai', 'ml', 'web', 'cloud'];
  const businessKeywords = ['business', 'marketing', 'finance', 'management', 'mba', 'consultant', 'analyst', 'manager'];
  const scienceKeywords = ['science', 'biology', 'chemistry', 'physics', 'research', 'scientist', 'lab'];
  const artsKeywords = ['art', 'design', 'creative', 'media', 'communications', 'journalism', 'writer'];
  
  const checkMatch = (keywords) => {
    const majorMatch = keywords.some(k => major.includes(k));
    const jobMatch = keywords.some(k => title.includes(k) || company.includes(k));
    return majorMatch && jobMatch;
  };
  
  if (checkMatch(techKeywords)) return 1;
  if (checkMatch(businessKeywords)) return 1;
  if (checkMatch(scienceKeywords)) return 1;
  if (checkMatch(artsKeywords)) return 1;
  
  return 0.4;
};

/**
 * Main matching function - calculates compatibility score between student and alumni
 * @param {Object} student - Student user object
 * @param {Object} alumni - Alumni user object
 * @returns {Object} - Match result with score and breakdown
 */
const calculateMatchScore = (student, alumni) => {
  const studentProfile = student.profile || {};
  const alumniProfile = alumni.profile || {};
  
  // Calculate individual scores
  const skillScore = calculateFuzzySkillMatch(
    studentProfile.skills,
    alumniProfile.skills
  );
  
  const industryScore = calculateIndustryMatch(
    studentProfile.major,
    alumniProfile.company,
    alumniProfile.jobTitle
  );
  
  const locationScore = calculateLocationMatch(
    studentProfile.location,
    alumniProfile.location
  );
  
  const graduationScore = calculateGraduationProximity(
    studentProfile.expectedGraduationYear,
    alumniProfile.graduationYear
  );
  
  // Calculate weighted total score
  const totalScore = 
    (skillScore * WEIGHTS.skillsMatch) +
    (industryScore * WEIGHTS.industryMatch) +
    (locationScore * WEIGHTS.locationMatch) +
    (graduationScore * WEIGHTS.graduationProximity) +
    (0.5 * WEIGHTS.availabilityMatch) + // Default availability score
    (0.5 * WEIGHTS.interestMatch); // Default interest score
  
  return {
    alumni: {
      _id: alumni._id,
      name: alumni.name,
      email: alumni.email,
      profile: alumniProfile,
    },
    matchScore: Math.round(totalScore * 100),
    breakdown: {
      skills: Math.round(skillScore * 100),
      industry: Math.round(industryScore * 100),
      location: Math.round(locationScore * 100),
      graduation: Math.round(graduationScore * 100),
    },
    matchReasons: generateMatchReasons(skillScore, industryScore, locationScore, graduationScore, studentProfile, alumniProfile),
  };
};

/**
 * Generate human-readable match reasons
 */
const generateMatchReasons = (skillScore, industryScore, locationScore, gradScore, studentProfile, alumniProfile) => {
  const reasons = [];
  
  if (skillScore > 0.5) {
    const commonSkills = (studentProfile.skills || []).filter(s => 
      (alumniProfile.skills || []).some(as => 
        as.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(as.toLowerCase())
      )
    );
    if (commonSkills.length > 0) {
      reasons.push(`Shares skills in ${commonSkills.slice(0, 3).join(', ')}`);
    }
  }
  
  if (industryScore > 0.7) {
    reasons.push(`Works in a field related to your major`);
  }
  
  if (locationScore > 0.6) {
    reasons.push(`Based in a similar location`);
  }
  
  if (gradScore > 0.8) {
    reasons.push(`Graduated recently enough to understand current challenges`);
  }
  
  if (alumniProfile.company) {
    reasons.push(`Currently at ${alumniProfile.company}`);
  }
  
  return reasons.slice(0, 4);
};

/**
 * Find best mentor matches for a student
 * @param {Object} student - Student user object
 * @param {Array} alumniList - List of available alumni mentors
 * @param {Object} options - Filtering options
 * @returns {Array} - Sorted list of matches with scores
 */
const findBestMatches = (student, alumniList, options = {}) => {
  const { limit = 10, minScore = 20 } = options;
  
  const matches = alumniList
    .filter(alumni => alumni._id.toString() !== student._id.toString()) // Exclude self
    .filter(alumni => alumni.isVerified) // Only verified alumni
    .map(alumni => calculateMatchScore(student, alumni))
    .filter(match => match.matchScore >= minScore)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
  
  return matches;
};

module.exports = {
  calculateMatchScore,
  findBestMatches,
  calculateJaccardSimilarity,
  calculateFuzzySkillMatch,
};
