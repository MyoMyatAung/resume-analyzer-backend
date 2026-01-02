import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export interface AnalysisResult {
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  experienceMatch: string;
  recommendations: string;
  summary: string;
}

@Injectable()
export class OpenAIService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get('OPENAI_API_KEY'),
    });
  }

  async extractTextFromResume(fileContent: Buffer, mimeType: string): Promise<string> {
    const base64Content = fileContent.toString('base64');
    const prompt = `Extract all text content from this ${mimeType.includes('pdf') ? 'PDF' : 'document'}. 
    Return only the extracted text without any additional commentary. 
    Include all sections: contact information, summary, experience, education, skills, and any other relevant information.
    
    Document base64 content:
    ${base64Content}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert document text extractor. You accurately extract all text from documents while preserving the structure.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 4000,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      throw new Error('Failed to extract text from resume');
    }
  }

  async analyzeResume(resumeText: string): Promise<string> {
    const prompt = `Analyze this resume and provide a structured summary including:
    1. Key skills and competencies
    2. Years of experience
    3. Notable achievements
    4. Education summary
    5. Career level assessment
    
    Resume content:
    ${resumeText}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert HR analyst who analyzes resumes.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 1000,
    });

    return response.choices[0]?.message?.content || '';
  }

  async matchResumeToJob(resumeText: string, jobDescription: string): Promise<AnalysisResult> {
    const prompt = `You are an expert HR analyst. Analyze the following resume against the job description and provide a detailed match analysis.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

Provide your analysis in the following JSON format (valid JSON only, no additional text):
{
  "matchScore": (percentage 0-100 based on skills match, experience requirements, and qualifications),
  "matchedSkills": [list of skills from the resume that match job requirements],
  "missingSkills": [list of important job requirements missing from the resume],
  "experienceMatch": "brief assessment of how well the candidate's experience matches",
  "recommendations": "specific, actionable recommendations for improving the resume for this role",
  "summary": "2-3 sentence overall summary of the candidate's fit for this position"
}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert HR analyst. Always respond with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 1500,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content || '{}';

    try {
      const result = JSON.parse(content);
      return {
        matchScore: Math.max(0, Math.min(100, result.matchScore || 0)),
        matchedSkills: result.matchedSkills || [],
        missingSkills: result.missingSkills || [],
        experienceMatch: result.experienceMatch || 'Unable to assess',
        recommendations: result.recommendations || '',
        summary: result.summary || '',
      };
    } catch {
      return {
        matchScore: 0,
        matchedSkills: [],
        missingSkills: [],
        experienceMatch: 'Unable to assess',
        recommendations: 'Unable to generate recommendations',
        summary: 'Analysis failed',
      };
    }
  }
}
