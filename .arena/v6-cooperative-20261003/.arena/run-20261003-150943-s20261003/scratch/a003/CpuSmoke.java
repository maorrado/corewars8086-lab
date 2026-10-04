import java.nio.file.*;
import java.util.*;
import il.co.codeguru.corewars8086.cpu.*;
import il.co.codeguru.corewars8086.memory.*;

public class CpuSmoke {
  static RealModeAddress a(int s,int o) {return new RealModeAddress((short)s,(short)o);}
  public static void main(String[] args) throws Exception {
    StringBuilder result=new StringBuilder();
    int[] placements={0x400,0x3c00,0x7400,0xb000,0xec00};
    for(String file:args) for(int place:placements) {
      RealModeMemoryImpl core=new RealModeMemoryImpl();
      for(int o=0;o<65536;o++) core.writeByte(a(0x1000,o),(byte)0xcc);
      byte[] code=Files.readAllBytes(Paths.get(file));
      for(int o=0;o<code.length;o++)core.writeByte(a(0x1000,place+o),code[o]);
      RealModeMemoryRegion arena=new RealModeMemoryRegion(a(0x1000,0),a(0x1000,0xffff));
      RealModeMemoryRegion stack=new RealModeMemoryRegion(a(0x2000,0),a(0x2000,0x800));
      RealModeMemoryRegion shared=new RealModeMemoryRegion(a(0x2100,0),a(0x2100,0x400));
      RestrictedAccessRealModeMemory memory=new RestrictedAccessRealModeMemory(core,new RealModeMemoryRegion[]{arena,stack,shared},new RealModeMemoryRegion[]{arena,stack,shared},new RealModeMemoryRegion[]{arena});
      CpuState s=new CpuState();s.setAX((short)place);s.setIP((short)place);s.setCS((short)0x1000);s.setDS((short)0x1000);s.setES((short)0x2100);s.setSS((short)0x2000);s.setSP((short)0x800);
      Cpu cpu=new Cpu(s,memory);int n=0,launches=0,nrg=0;String status="alive";
      try {
        for(;n<20000;n++) {
          int op=core.readByte(a(s.getCS(),s.getIP()))&255;
          if(op==0xab)launches++;
          if(op==0x9b)nrg++;
          cpu.nextOpcode();
          // Semantics test only: deliberately omit War's random bonus scheduling.
          if(n%5==0&&s.getEnergy()!=0)s.setEnergy((short)((s.getEnergy()&65535)-1));
        }
      }catch(Exception e){status=e.getClass().getSimpleName();}
      String line=String.format(Locale.ROOT,"%s place=%04x status=%s ops=%d launches=%d nrg=%d csip=%04x:%04x cx=%04x si=%04x sp=%04x%n",Paths.get(file).getFileName(),place,status,n,launches,nrg,s.getCS()&65535,s.getIP()&65535,s.getCX()&65535,s.getSI()&65535,s.getSP()&65535);
      result.append(line);System.out.print(line);
    }
    Files.write(Paths.get("C:/Maor/CodeGuru/corewars8086-lab/.arena/v6-cooperative-20261003/.arena/run-20261003-150943-s20261003/scratch/a003/cpu-smoke.txt"),result.toString().getBytes("UTF-8"));
  }
}
