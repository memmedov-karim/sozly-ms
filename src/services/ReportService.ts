import { ResourceNotFoundException } from '../error/ResourceNotFoundException';
import ChatSession from '../models/ChatSession';
import Report from '../models/Report';
import { ReportBody } from '../types';

export async function save(
  report: ReportBody,
  reporterIp: string,
  reporterUniqueUserId?: string
): Promise<void> {
  const currentChat = await ChatSession.findOne({ sessionId: report.sessionId });
  if (!currentChat)
    throw new ResourceNotFoundException(
      'There is not ChatSession with given sessionId: ' + report.sessionId,
    );
  
  const users = currentChat.users;
  
  // Find reported user by filtering out the reporter
  let reportedIp = reporterIp;
  let reportedUniqueUserId = reporterUniqueUserId;
  
  // Try to find by uniqueUserId first if available
  if (reporterUniqueUserId) {
    const filteredUsers = users.filter((user) => user.uniqueUserId !== reporterUniqueUserId);
    if (filteredUsers.length > 0) {
      reportedIp = filteredUsers[0].ip;
      reportedUniqueUserId = filteredUsers[0].uniqueUserId;
    }
  } else {
    // Fallback to IP-based filtering
    const filteredUsers = users.filter((user) => user.ip !== reporterIp);
    if (filteredUsers.length > 0) {
      reportedIp = filteredUsers[0].ip;
      reportedUniqueUserId = filteredUsers[0].uniqueUserId;
    }
  }

  console.log(reportedUniqueUserId, reporterUniqueUserId)
  
  const rprt = new Report({
    sessionId: report.sessionId,
    reporterIp,
    reportedIp,
    reporterUniqueUserId,
    reportedUniqueUserId,
    message: report.message,
  });

  await rprt.save();
}
