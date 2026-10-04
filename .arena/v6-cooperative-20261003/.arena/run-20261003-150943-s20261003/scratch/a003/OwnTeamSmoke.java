import java.nio.file.*;
import il.co.codeguru.corewars8086.cpu.*;
import il.co.codeguru.corewars8086.memory.*;
public class OwnTeamSmoke {
  static RealModeAddress a(int s,int o){return new RealModeAddress((short)s,(short)o);}
  static void load(RealModeMemoryImpl mem,byte[]bytes,int offset){for(int i=0;i<bytes.length;i++)mem.writeByte(a(0x1000,offset+i),bytes[i]);}
  static CpuState state(int offset){CpuState s=new CpuState();s.setAX((short)offset);s.setIP((short)offset);s.setCS((short)0x1000);s.setDS((short)0x1000);s.setES((short)0x2100);s.setSS((short)0x2000);s.setSP((short)0x800);return s;}
  public static void main(String[]files)throws Exception{
    StringBuilder output=new StringBuilder();
    for(String file:files)for(String victim:new String[]{"Good_Test_V6_1","Good_Test_V6_2"}){
      RealModeMemoryImpl mem=new RealModeMemoryImpl();for(int i=0;i<65536;i++)mem.writeByte(a(0x1000,i),(byte)0xcc);
      load(mem,Files.readAllBytes(Paths.get("C:/Maor/CodeGuru/corewars8086-lab/study-notes/good-test-v6/original-binaries/"+victim)),0x400);
      load(mem,Files.readAllBytes(Paths.get(file)),0x5000);
      RealModeMemoryRegion ar=new RealModeMemoryRegion(a(0x1000,0),a(0x1000,65535));
      RealModeMemoryRegion st=new RealModeMemoryRegion(a(0x2000,0),a(0x2000,0x800));
      RealModeMemoryRegion sh=new RealModeMemoryRegion(a(0x2100,0),a(0x2100,0x400));
      RealModeMemory memory=new RestrictedAccessRealModeMemory(mem,new RealModeMemoryRegion[]{ar,st,sh},new RealModeMemoryRegion[]{ar,st,sh},new RealModeMemoryRegion[]{ar});
      CpuState v=state(0x400);Cpu cpu=new Cpu(v,memory);
      for(int n=0;n<2000;n++)cpu.nextOpcode();
      int target=mem.readWord(a(v.getDS(),v.getBX()))&65535;
      int frame=(v.getSP()&65535)+2;
      CpuState z=state(0x5000);z.setIP((short)(0x5000+0x99));z.setAX((short)(frame-0x100));z.setES((short)0x1000);
      Cpu zombie=new Cpu(z,memory);
      int before=mem.readWord(a(0xffb,target))&65535;
      // BX's phase is deliberately aligned to a real frame to make the counterexample exact.
      for(int n=0;n<40;n++)zombie.nextOpcode();
      int after=mem.readWord(a(0xffb,target))&65535;
      String status="alive";try{for(int n=0;n<10;n++)cpu.nextOpcode();}catch(Exception e){status=e.getClass().getSimpleName();}
      String line=String.format("%s victim=%s frame=%04x target=%04x before=%04x after=%04x victim_after=%s%n",Paths.get(file).getFileName(),victim,frame&65535,target,before,after,status);
      output.append(line);System.out.print(line);
    }
    Files.write(Paths.get("C:/Maor/CodeGuru/corewars8086-lab/.arena/v6-cooperative-20261003/.arena/run-20261003-150943-s20261003/scratch/a003/own-team-smoke.txt"),output.toString().getBytes("UTF-8"));
  }
}
