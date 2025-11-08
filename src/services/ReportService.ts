import { ResourceNotFoundException } from '../error/ResourceNotFoundException';
import ChatSession from '../models/ChatSession';
import Report from '../models/Report';
import { ReportBody } from '../types';

export async function save(report: ReportBody, reporterIp: string): Promise<void> {
  const currentChat = await ChatSession.findOne({ sessionId: report.sessionId });
  if (!currentChat)
    throw new ResourceNotFoundException(
      'There is not ChatSession with given sessionId: ' + report.sessionId,
    );
  const users = currentChat.users;
  var reportedIp = reporterIp;
  const filteredUsers = users.filter((user) => user.ip !== reporterIp);
  if(filteredUsers.length > 0) {
    reportedIp = filteredUsers[0].ip;
  }
  const rprt = new Report({
    sessionId: report.sessionId,
    reporterIp,
    reportedIp,
    message: report.message,
  });

  await rprt.save();
}
