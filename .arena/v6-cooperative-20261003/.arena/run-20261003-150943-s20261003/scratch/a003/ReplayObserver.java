import com.google.devtools.common.options.OptionsParser;
import il.co.codeguru.corewars8086.cli.Options;
import il.co.codeguru.corewars8086.cpu.CpuState;
import il.co.codeguru.corewars8086.memory.*;
import il.co.codeguru.corewars8086.war.*;
import java.io.*;
import java.util.*;
public class ReplayObserver implements CompetitionEventListener,MemoryEventListener {
  Competition c;PrintWriter log;int round,warIndex,captures,hits,writes;Set<String> captured=new HashSet<>();Set<String> seen=new HashSet<>();
  ReplayObserver(Options opt,String out)throws Exception{log=new PrintWriter(out);c=new Competition(opt);c.addCompetitionEventListener(this);c.addMemoryEventLister(this);c.setSeed(opt.seed.hashCode());}
  public static void main(String[]args)throws Exception{OptionsParser p=OptionsParser.newOptionsParser(Options.class);p.parse(Arrays.copyOfRange(args,1,args.length));Options opt=p.getOptions(Options.class);ReplayObserver r=new ReplayObserver(opt,args[0]);r.c.runCompetition(5,4,false);r.log.close();}
  public void onWarStart(long seed){warIndex++;round=0;captures=hits=writes=0;captured.clear();seen.clear();log.println("START war="+warIndex+" seed="+seed);}
  Warrior aWar(){War w=c.getCurrentWar();for(int i=0;i<w.getNumWarriors();i++)if(w.getWarrior(i).getName().equals("CAND1"))return w.getWarrior(i);return null;}
  public void onRound(int n){round=n;War w=c.getCurrentWar();Warrior owner=aWar();if(owner==null)return;int lo=(owner.getLoadOffset()&65535)+0x99,hi=lo+84;for(int i=0;i<w.getNumWarriors();i++){Warrior z=w.getWarrior(i);CpuState s=z.getCpuState();if(z.isAlive()&&z.isZombie()&&(s.getCS()&65535)==0x1000&&(s.getIP()&65535)>=lo&&(s.getIP()&65535)<hi&&captured.add(z.getName())){captures++;log.println("CAPTURE round="+round+" name="+z.getName()+" ax="+(s.getAX()&65535)+" bx="+(s.getBX()&65535));}}}
  public void onMemoryWrite(RealModeAddress address){War w=c.getCurrentWar();if(w==null||w.getNumWarriors()==0)return;Warrior z=w.getWarrior(w.getCurrentWarrior());if(!z.isZombie())return;Warrior owner=aWar();if(owner==null)return;CpuState s=z.getCpuState();int expected=((owner.getLoadOffset()&65535)+0xdb)&65535;
    if((s.getCS()&65535)!=0x1000||(s.getIP()&65535)!=expected||(s.getDX()&65535)!=0xcccc)return;
    // Original scanner MOV [DI],DX has already fetched two bytes at this callback.
    int physical=address.getLinearAddress();if(physical!=new RealModeAddress(s.getDS(),s.getDI()).getLinearAddress())return;
    writes++;String key=round+":"+z.getName()+":"+physical;if(!seen.add(key))return;
    log.println("SCANNER_WRITE round="+round+" name="+z.getName()+" target="+Integer.toHexString(physical-0x10000));
    for(int i=0;i<w.getNumWarriors();i++){Warrior v=w.getWarrior(i);if(!v.isAlive()||!v.getGroupName().equals("CAND"))continue;CpuState vs=v.getCpuState();if((vs.getCS()&65535)!=0xffb)continue;try{int point=w.getMemory().readWord(new RealModeAddress(vs.getDS(),vs.getBX()))&65535;int target=0xffb*16+point;if(target==physical){hits++;log.println("OWN_HIT round="+round+" victim="+v.getName()+" ip="+Integer.toHexString(vs.getIP()&65535)+" seed="+Integer.toHexString(point));}}catch(Exception e){}}
  }
  public void onWarEnd(int reason,String winners){log.println("END round="+round+" captures="+captures+" scannerWrites="+writes+" ownHits="+hits+" winners="+winners);log.flush();}
  public void onWarriorBirth(String name){War w=c.getCurrentWar();Warrior v=w.getWarrior(w.getNumWarriors()-1);log.println("LOAD name="+name+" offset="+Integer.toHexString(v.getLoadOffset()&65535));}
  public void onWarriorDeath(String name,String reason){log.println("DEATH round="+round+" name="+name+" reason="+reason);}
  public void onCompetitionStart(){}public void onCompetitionEnd(){}public void onEndRound(){}
}
